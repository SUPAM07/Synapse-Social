import { SignIn } from "@clerk/nextjs"

const SignInPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
        <SignIn path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/" />
    </div>
  )
}

export default SignInPage