import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useContext } from "react"
import AuthContext from "../context/AuthContext";

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        username: "",
        password: ""
    })
    const { register, loginWithGoogle } = useContext(AuthContext);
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<{ name?: string; username?: string; email?: string; password?: string }>({})

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { name?: string; username?: string; email?: string; password?: string } = {}
        if (!formData.name.trim()) newErrors.name = "Name is required"
        if (!formData.username.trim()) newErrors.username = "Username is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter a valid email"
        if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        try {
            await register({
                name: formData.name,
                userName: formData.username, // corrected to camelCase
                email: formData.email,       // added email field
                password: formData.password
            });
            // Optionally, redirect or show success
        } catch (error) {
            // Optionally, handle error (e.g., show error message)
            console.error(error);
        }
    }

    const handleGoogleSignup = () => {
        loginWithGoogle();
    };
    
    return (
        <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
            <Card className="shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl">Create your account</CardTitle>
                    <CardDescription>Enter your details to get started</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your full name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Choose a username"
                                required
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                            {errors.username && (
                                <p className="text-xs text-destructive">{errors.username}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword(v => !v)}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2l20 20"/><path d="M10.58 10.58a2 2 0 102.83 2.83"/><path d="M16.681 16.681C15.24 17.525 13.663 18 12 18 7 18 2.73 14.94 1 12c.56-.86 1.31-1.75 2.22-2.57"/><path d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 9.27 3.06 11 6-1.046 1.606-2.614 3.112-4.57 4.31"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                                    )}
                                </Button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full">
                            Sign up
                        </Button>

                        <div className="relative text-center">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative inline-block bg-background px-2 text-xs text-muted-foreground">
                                or continue with
                            </div>
                        </div>

                        <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignup}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 size-4" aria-hidden>
                                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.827 32.255 29.337 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.91 6.053 29.702 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.652-.389-3.917z"/>
                                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.312 16.108 18.767 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.91 6.053 29.702 4 24 4 16.318 4 9.682 8.337 6.306 14.691z"/>
                                <path fill="#4CAF50" d="M24 44c5.251 0 10.074-2.007 13.674-5.274l-6.307-5.329C29.224 35.488 26.715 36 24 36c-5.314 0-9.817-3.765-11.287-8.804l-6.58 5.066C9.47 39.556 16.227 44 24 44z"/>
                                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.02 3.172-3.275 5.733-6.036 7.314.001-.001 6.307 5.329 6.307 5.329C38.033 37.986 44 32 44 24c0-1.341-.138-2.652-.389-3.917z"/>
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <a href="/login" className="underline underline-offset-4">Log in</a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
