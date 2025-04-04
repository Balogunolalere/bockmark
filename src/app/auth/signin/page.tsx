import { Metadata } from "next"
import SignInForm from "@/components/auth/SignInForm"

export const metadata: Metadata = {
  title: "Sign In - Blockmark",
  description: "Sign in to your account",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen w-screen bg-pink-200 py-16">
      <div className="mx-auto w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-black tracking-tight">
            BLOCKMARK
          </h1>
          <p className="text-xl font-bold text-gray-700">
            Welcome back!
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}