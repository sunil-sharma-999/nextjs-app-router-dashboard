import { dbQuery } from '@/app/lib/db/db';
import { User } from '@/app/lib/definitions';
import { NextRequest, NextResponse } from 'next/server';
import { date, z } from 'zod';
import bcrypt from 'bcrypt';

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await dbQuery<User[]>(
      `SELECT * FROM users WHERE email="${email}"`,
    );
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    const { email, password } = (await req.json()) as User;
    const parsedCredentials = z
      .object({ email: z.string().email(), password: z.string().min(6) })
      .safeParse({ email, password });

    if (parsedCredentials.success) {
      const { email, password } = parsedCredentials.data;
      const user = await getUser(email);
      if (!user)
        return Response.json(
          { data: null },
          {
            status: 400,
          },
        );

      const passwordsMatch = await bcrypt.compare(password, user.password);
      if (passwordsMatch)
        return Response.json(
          {
            data: user,
          },
          {
            status: 200,
          },
        );
    }
    return Response.json(
      { data: null },
      {
        status: 400,
      },
    );
  } catch (e) {
    return Response.json(null, {
      status: 500,
    });
  }
};
