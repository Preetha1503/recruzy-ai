import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  BookOpen,
  Brain,
  ChevronRight,
  Clock,
  FileText,
  BarChart,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Award,
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-700" />
            <span className="text-2xl font-bold text-purple-800">SAMAJH</span>
          </div>
          <nav className="hidden gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-purple-700 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-purple-700 transition-colors"
            >
              How It Works
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="outline"
              className="hidden border-purple-200 text-purple-700 hover:bg-purple-50 sm:flex"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-purple-700 text-white hover:bg-purple-800">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-purple-50 via-purple-100 to-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="flex flex-col justify-center space-y-6">
              <div className="inline-flex items-center rounded-full border border-purple-200 bg-white px-3 py-1 text-sm text-purple-700 shadow-sm">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                <span>AI-Powered Interview Platform</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter text-purple-900 sm:text-5xl md:text-6xl lg:text-6xl">
                  Master Your <span className="text-purple-700">Interview Skills</span> With AI
                </h1>
                <p className="max-w-[600px] text-gray-600 md:text-xl">
                  Prepare, practice, and perfect your interview skills with our intelligent assessment platform. Get
                  personalized feedback and improve your chances of landing your dream job.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Button asChild size="lg" className="bg-purple-700 text-white hover:bg-purple-800">
                  <Link href="/register">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center"></div>
                <div className="flex items-center"></div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[400px] w-[400px] sm:h-[450px] sm:w-[450px] lg:h-[500px] lg:w-[500px]">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 opacity-20 blur-3xl"></div>
                <div className="relative flex h-full w-full items-center justify-center rounded-xl border border-purple-200 bg-white p-4 shadow-xl">
                  <div className="space-y-6 p-4 w-full">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 w-3/4 rounded bg-purple-100"></div>
                      <div className="h-4 w-full rounded bg-purple-100"></div>
                      <div className="h-4 w-5/6 rounded bg-purple-100"></div>
                      <div className="h-4 w-full rounded bg-purple-100"></div>
                      <div className="h-4 w-2/3 rounded bg-purple-100"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 rounded-full bg-purple-200"></div>
                        <div className="h-10 w-full rounded bg-purple-200"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 rounded-full bg-purple-200"></div>
                        <div className="h-10 w-full rounded bg-purple-200"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 rounded-full bg-purple-200"></div>
                        <div className="h-10 w-full rounded bg-purple-200"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 rounded-full bg-green-200"></div>
                        <div className="h-10 w-full rounded bg-green-100"></div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="h-10 w-1/3 rounded bg-purple-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm text-purple-700 shadow-sm">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              <span>Features</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter text-purple-900 sm:text-4xl md:text-5xl">
                Everything You Need to Succeed
              </h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform provides all the tools you need to prepare for your interviews and excel in your career.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 rounded-lg border border-purple-100 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
              <div className="rounded-full bg-purple-100 p-3">
                <BookOpen className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-purple-900">AI-Generated Tests</h3>
              <p className="text-center text-gray-600">
                Customized tests created by AI to match your specific interview needs and job requirements.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border border-purple-100 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
              <div className="rounded-full bg-purple-100 p-3">
                <Clock className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-purple-900">Timed Assessments</h3>
              <p className="text-center text-gray-600">
                Practice under realistic time constraints to build confidence and speed for real interviews.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border border-purple-100 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
              <div className="rounded-full bg-purple-100 p-3">
                <BarChart className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-purple-900">Detailed Analytics</h3>
              <p className="text-center text-gray-600">
                Comprehensive performance metrics to track your progress and identify areas for improvement.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border border-purple-100 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
              <div className="rounded-full bg-purple-100 p-3">
                <FileText className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-purple-900">Topic Coverage</h3>
              <p className="text-center text-gray-600">
                Wide range of topics and difficulty levels to ensure comprehensive preparation for any interview.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border border-purple-100 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
              <div className="rounded-full bg-purple-100 p-3">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-purple-900">User Management</h3>
              <p className="text-center text-gray-600">
                Easy administration for teams and organizations to track candidate progress and performance.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border border-purple-100 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
              <div className="rounded-full bg-purple-100 p-3">
                <Shield className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-purple-900">Secure Platform</h3>
              <p className="text-center text-gray-600">
                Enterprise-grade security to protect your data and assessment content with advanced encryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-purple-50 via-purple-100 to-white"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-purple-200 bg-white px-3 py-1 text-sm text-purple-700 shadow-sm">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              <span>How It Works</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter text-purple-900 sm:text-4xl md:text-5xl">
                Simple Process, Powerful Results
              </h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform makes it easy to prepare for interviews with a straightforward process designed for
                success.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-200 text-purple-700">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-900">Register</h3>
              <p className="text-center text-gray-600">
                Create your account and set up your profile with your areas of interest and career goals.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Quick sign-up process</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Personalized dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Skill assessment</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-200 text-purple-700">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-900">Take Tests</h3>
              <p className="text-center text-gray-600">
                Complete assigned tests or choose from our library of AI-generated assessments tailored to your needs.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Adaptive difficulty</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Real-time feedback</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Industry-specific questions</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-200 text-purple-700">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white">
                  <BarChart className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-900">Analyze Results</h3>
              <p className="text-center text-gray-600">
                Review your performance analytics and focus on improving your weak areas with personalized
                recommendations.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Detailed performance metrics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>AI-powered insights</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Personalized study plan</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center space-y-6">
              <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm text-purple-700 shadow-sm">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                <span>Platform Overview</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter text-purple-900 sm:text-4xl">
                  Comprehensive Interview Preparation
                </h2>
                <p className="text-gray-600 md:text-lg">
                  Our platform offers a complete suite of tools to help you prepare for any interview scenario. From
                  technical assessments to behavioral questions, we've got you covered.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-purple-100 p-2">
                    <CheckCircle className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900">Personalized Learning Path</h3>
                    <p className="text-gray-600">Tailored study plans based on your performance and career goals.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-purple-100 p-2">
                    <CheckCircle className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900">AI-Generated Questions</h3>
                    <p className="text-gray-600">
                      Fresh, relevant questions that match real-world interview scenarios.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-purple-100 p-2">
                    <CheckCircle className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900">Detailed Performance Analytics</h3>
                    <p className="text-gray-600">
                      Track your progress and identify areas for improvement with comprehensive metrics.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <Button asChild className="bg-purple-700 text-white hover:bg-purple-800">
                  <Link href="/register">
                    Try It For Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative overflow-hidden rounded-xl border border-purple-200 bg-white shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-white opacity-50"></div>
                <div className="relative p-2">
                  <div className="flex items-center gap-2 border-b border-purple-100 bg-purple-50 p-2 rounded-t-lg">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="ml-2 text-xs text-gray-500">SAMAJH Dashboard</div>
                  </div>
                  <div className="p-4 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-purple-100 p-4 h-24 flex flex-col justify-center items-center">
                        <div className="text-2xl font-bold text-purple-800">85%</div>
                        <div className="text-xs text-purple-600">Average Score</div>
                      </div>
                      <div className="rounded-lg bg-purple-100 p-4 h-24 flex flex-col justify-center items-center">
                        <div className="text-2xl font-bold text-purple-800">12</div>
                        <div className="text-xs text-purple-600">Tests Taken</div>
                      </div>
                      <div className="rounded-lg bg-purple-100 p-4 h-24 flex flex-col justify-center items-center">
                        <div className="text-2xl font-bold text-purple-800">3</div>
                        <div className="text-xs text-purple-600">Skills Mastered</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-1/3 bg-purple-200 rounded-full"></div>
                      <div className="h-24 w-full bg-purple-50 rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-1/4 bg-purple-200 rounded-full"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 w-full bg-purple-50 rounded-lg"></div>
                        <div className="h-32 w-full bg-purple-50 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-purple-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border border-purple-700 bg-purple-800 px-3 py-1 text-sm text-white shadow-sm">
              <Award className="mr-1 h-3.5 w-3.5" />
              <span>Start Your Journey</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Ace Your Next Interview?
              </h2>
              <p className="mx-auto max-w-[700px] text-purple-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of professionals who have improved their interview skills with our platform. Start your
                free trial today.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" className="bg-white text-purple-900 hover:bg-gray-100">
                <Link href="/register">
                  Get Started Free
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-purple-700 text-white hover:bg-purple-800">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t bg-white py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-purple-700" />
                <span className="text-xl font-bold text-purple-800">SAMAJH</span>
              </div>
              <p className="text-gray-500 mb-4 max-w-xs">
                AI-powered interview preparation platform helping professionals ace their interviews and advance their
                careers.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-purple-700">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
            <div className="col-span-1">
              <h4 className="font-semibold text-gray-900">Company</h4>
              <nav className="flex flex-col space-y-3 mt-4">
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  About
                </Link>
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  Careers
                </Link>
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  Contact
                </Link>
              </nav>
            </div>
            <div className="col-span-1">
              <h4 className="font-semibold text-gray-900">Resources</h4>
              <nav className="flex flex-col space-y-3 mt-4">
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  Blog
                </Link>
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  Documentation
                </Link>
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  Help Center
                </Link>
              </nav>
            </div>
            <div className="col-span-1">
              <h4 className="font-semibold text-gray-900">Legal</h4>
              <nav className="flex flex-col space-y-3 mt-4">
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  Privacy
                </Link>
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  Terms
                </Link>
                <Link href="#" className="text-gray-600 hover:text-purple-700">
                  Cookie Policy
                </Link>
              </nav>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-gray-500">
            <p>© 2023 SAMAJH. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
