import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { Container } from '@/components/Container';
import { NextAuthExample } from '@/components/NextAuthExample';
import { WagmiExample } from '@/components/WagmiExample';

async function getSession() {
    return await getServerSession(authOptions);
}

export default async function Home() {
    const session = await getSession();
    return (
        <Container
            MainArea={
                <>
                    <h2>Wagmi</h2>
                    <WagmiExample />

                    <h2 className="mt-12">Twitter</h2>
                    <NextAuthExample session={session} />
                </>
            }
        />
    );
}
