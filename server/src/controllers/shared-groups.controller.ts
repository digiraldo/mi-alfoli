import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

interface AuthRequest extends Request {
  userId?: string;
}

const createGroupSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  totalBudget: z.number().optional(),
});

export const getSharedGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Obtener grupos donde soy dueño O soy miembro
    const groups = await (prisma as any).sharedGroup.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, fullName: true, avatarUrl: true } },
        members: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } }
        },
        _count: { select: { transactions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching shared groups:', error);
    res.status(500).json({ message: 'Error al obtener los grupos compartidos' });
  }
};

export const createSharedGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const body = createGroupSchema.parse(req.body);

    const group = await (prisma as any).sharedGroup.create({
      data: {
        ownerId: userId,
        title: body.title,
        description: body.description,
        icon: body.icon || '👥',
        color: body.color || '#00BCD4',
        totalBudget: body.totalBudget,
      },
      include: {
        owner: { select: { id: true, fullName: true, avatarUrl: true } },
        members: true
      }
    });

    res.status(201).json(group);
  } catch (error: any) {
    console.error('Error creating shared group:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: 'Error al crear el grupo' });
  }
};

export const getSharedGroupById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const group = await (prisma as any).sharedGroup.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, avatarUrl: true, email: true } },
        members: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true, email: true } } }
        },
        transactions: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
            category: true
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    // Verificar si el usuario tiene acceso (owner o member)
    const isMember = group.ownerId === userId || group.members.some((m: any) => m.userId === userId);
    if (!isMember) return res.status(403).json({ message: 'No tienes acceso a este grupo' });

    res.json(group);
  } catch (error) {
    console.error('Error fetching shared group details:', error);
    res.status(500).json({ message: 'Error al obtener detalles del grupo' });
  }
};

export const joinSharedGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { groupId } = req.params;

    const group = await (prisma as any).sharedGroup.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    if (group.ownerId === userId) {
      return res.status(400).json({ message: 'Ya eres el creador de este grupo' });
    }

    const existingMember = await (prisma as any).sharedMember.findUnique({
      where: { sharedGroupId_userId: { sharedGroupId: groupId, userId } }
    });

    if (existingMember) {
      return res.status(400).json({ message: 'Ya eres miembro de este grupo' });
    }

    const newMember = await (prisma as any).sharedMember.create({
      data: { sharedGroupId: groupId, userId },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } }
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error joining shared group:', error);
    res.status(500).json({ message: 'Error al unirse al grupo' });
  }
};

export const calculateBalances = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // 1. Validar Grupo y Miembros
    const group = await (prisma as any).sharedGroup.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true } },
        members: { include: { user: { select: { id: true, fullName: true } } } },
        transactions: {
          where: { type: 'expense' } // Solo los egresos suman a la deuda colectiva
        }
      }
    });

    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    // 2. Extraer todos los participantes (Dueño + Miembros)
    const participants = [
      { id: group.owner.id, name: group.owner.fullName },
      ...group.members.map((m: any) => ({ id: m.user.id, name: m.user.fullName }))
    ];

    if (participants.length <= 1) {
      return res.json({ 
        totalSpent: Number(group.transactions.reduce((acc: number, t: any) => acc + Number(t.amount), 0)), 
        balances: [], 
        settlements: [] 
      });
    }

    // 3. Sumar cuánto gastó cada persona
    const spentByUser: Record<string, number> = {};
    participants.forEach(p => spentByUser[p.id] = 0);

    let totalSpent = 0;
    group.transactions.forEach((t: any) => {
      const amt = Number(t.amount);
      totalSpent += amt;
      if (spentByUser[t.userId] !== undefined) {
        spentByUser[t.userId] += amt;
      }
    });

    // 4. Calcular el "Deber Ser" (Fair Share) por cabeza
    const fairShare = totalSpent / participants.length;

    // 5. Calcular los Balances (Positivo = Acreedor (Le deben), Negativo = Deudor (Debe dar))
    const balances = participants.map(p => ({
      userId: p.id,
      name: p.name,
      paid: spentByUser[p.id],
      balance: spentByUser[p.id] - fairShare
    }));

    // 6. Algoritmo de Liquidación (Quién le paga a quién)
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    const settlements: { fromId: string; fromName: string; toId: string; toName: string; amount: number }[] = [];

    let i = 0; // index de deudores
    let j = 0; // index de acreedores

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // Lo que falta pagar vs lo que falta cobrar
      const debt = Math.abs(debtor.balance);
      const credit = creditor.balance;

      const settledAmount = Math.min(debt, credit);

      settlements.push({
        fromId: debtor.userId,
        fromName: debtor.name,
        toId: creditor.userId,
        toName: creditor.name,
        amount: settledAmount
      });

      // Actualizar los remanentes
      debtor.balance += settledAmount; // se acerca a 0
      creditor.balance -= settledAmount; // se acerca a 0

      // Si el deudor saldó su deuda, pasa al siguiente
      if (Math.abs(debtor.balance) < 0.01) i++;
      // Si el acreedor ya cobró todo, pasa al siguiente
      if (creditor.balance < 0.01) j++;
    }

    res.json({
      totalSpent,
      fairShare,
      balances,
      settlements
    });

  } catch (error) {
    console.error('Error calculando balances:', error);
    res.status(500).json({ message: 'Error procesando saldos del grupo' });
  }
};
