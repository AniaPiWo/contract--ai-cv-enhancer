import { SignUp } from "@clerk/remix";

export default function SignUpRoute() {
  return (
    <main className="flex flex-col h-screen items-center justify-center h-[calc(100vh-80px)]">
      <SignUp />
    </main>
  );
}
