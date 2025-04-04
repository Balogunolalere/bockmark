import { Metadata } from "next"
import SignUpForm from "@/components/auth/SignUpForm"

export const metadata: Metadata = {
  title: "Sign Up - Blockmark",
  description: "Create your account",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-pink-200 px-4 py-8 sm:py-16">
      <div className="mx-auto w-full max-w-[400px]">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="mb-2 text-3xl sm:text-4xl font-black tracking-tight">
            BLOCKMARK
          </h1>
          <p className="text-lg sm:text-xl font-bold text-gray-700">
            Create your account
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}