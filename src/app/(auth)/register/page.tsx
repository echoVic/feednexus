import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>
            创建您的 RSS 阅读器账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground">
            已有账号？{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
