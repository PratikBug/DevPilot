import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  events: {
    async linkAccount({ user, profile }) {
      if (profile && "id" in profile) {
        await db.user.update({
          where: { id: user.id! },
          data: { githubId: String(profile.id) },
        });
      }
    },
  },
});
