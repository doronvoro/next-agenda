"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { z } from "zod";

import { useAuth } from "@/lib/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("אנא הזן כתובת דואר אלקטרוני תקינה"),
  password: z.string().min(6, "הסיסמה חייבת להיות לפחות 6 תווים"),
});

export function LoginForm() {
  const router = useRouter();

  const { logIn, error: authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      const result = loginSchema.safeParse({ email, password });

      if (!result.success) {
        const errors: { email?: string; password?: string } = {};
        result.error.errors.forEach((error: z.ZodIssue) => {
          if (error.path[0]) {
            errors[error.path[0] as "email" | "password"] = error.message;
          }
        });
        setValidationErrors(errors);
        return;
      }

      setIsLoading(true);
      const loginResult = await logIn(email, password);
      if (!loginResult?.error) {
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 my-4 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">ברוכים חזרה</h1>
                <p className="text-balance text-muted-foreground">
                  התחברות לחשבון שלך
                </p>
              </div>
              {authError && (
                <div className="text-sm text-destructive text-center">
                  {authError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">דואר אלקטרוני</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive">
                    {validationErrors.email}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">סיסמה</Label>
                  <a
                    href="/auth/reset-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    שכחת את הסיסמה?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                {validationErrors.password && (
                  <p className="text-sm text-destructive">
                    {validationErrors.password}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "מתחבר..." : "המשך"}
              </Button>
              <div className="text-center text-sm">
                אין לך חשבון?{" "}
                <a href="/auth/signup" className="underline underline-offset-4">
                  הירשם
                </a>
              </div>
            </div>
          </form>

          <div className="relative hidden h-full bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        בלחיצה על המשך, אתה מסכים ל-{" "}
        <a href="/info/legal/terms-of-service">תנאי השירות</a> ו-{" "}
        <a href="/info/legal/privacy-policy">מדיניות הפרטיות</a>.
      </div>
    </div>
  );
}
