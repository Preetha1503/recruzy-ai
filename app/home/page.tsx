"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Brain,
  ChevronRight,
  Sparkles,
  Award,
  Users,
  FileText,
  BarChart,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Shield,
  Briefcase,
} from "lucide-react"
import { PLATFORM_NAME } from "@/lib/constants"

// Simple client component to handle smooth scrolling
function SmoothScroll() {
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const href = e.target.closest("a")?.getAttribute("href")
      if (href?.startsWith("#")) {
        e.preventDefault()
        const targetId = href.substring(1)
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" })
        }
      }
    }

    document.addEventListener("click", handleAnchorClick)
    return () => document.removeEventListener("click", handleAnchorClick)
  }, [])

  return null
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-50 to-white">
      <SmoothScroll />
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-100">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-800">{PLATFORM_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100 transition-colors duration-200"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-36 lg:py-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-purple-200/20 to-transparent"></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 animate-pulse">
                <Sparkles className="mr-2 h-4 w-4" />
                Powered by Advanced AI
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-purple-900 sm:text-6xl lg:text-7xl">
                Excel in <span className="text-purple-600">Interviews</span> with AI Mastery
              </h1>
              <p className="text-lg text-purple-700 max-w-md leading-relaxed">
                Transform your interview preparation with AI-driven practice, real-time feedback, and personalized
                insights to secure your dream role.
              </p>
              <div className="flex gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-purple-600 text-white hover:bg-purple-700 transform hover:scale-105 transition-all duration-200"
                >
                  <Link href="/register">
                    Start Your Journey
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-purple-300 text-purple-600 hover:bg-purple-100 transform hover:scale-105 transition-all duration-200"
                >
                  <Link href="#how-it-works">Explore Features</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-300/30 rounded-full blur-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-purple-200 transform hover:scale-102 transition-transform duration-300">
                <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-t-lg">
                  <div className="h-3 w-3 rounded-full bg-purple-400"></div>
                  <div className="h-3 w-3 rounded-full bg-purple-300"></div>
                  <div className="h-3 w-3 rounded-full bg-purple-200"></div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div className="text-lg font-semibold text-purple-800">Your Dashboard</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-purple-600">Recent Activity</div>
                    <div className="bg-purple-50 p-3 rounded-lg text-purple-700 text-sm">
                      Completed Technical Interview Prep - Score: 92%
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-purple-700 text-sm">
                      Behavioral Questions Practice - Score: 88%
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-purple-600 text-white hover:bg-purple-700 rounded-lg px-4 py-2 text-sm">
                      Start New Test
                    </Button>
                    <Button
                      variant="outline"
                      className="border-purple-300 text-purple-600 hover:bg-purple-100 rounded-lg px-4 py-2 text-sm"
                    >
                      View All Results
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Why Choose Us
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-purple-900 sm:text-5xl">
              Empower Your Interview Success
            </h2>
            <p className="text-lg text-purple-700 max-w-3xl mx-auto leading-relaxed">
              Our cutting-edge features are designed to give you a competitive edge in any interview scenario.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <div className="group bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-purple-600 text-white mb-4">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900">AI-Crafted Assessments</h3>
              <p className="text-purple-700 mt-2">
                Dynamic tests tailored to your industry, role, and skill level for targeted preparation.
              </p>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-purple-600 text-white mb-4">
                <BarChart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900">Real-Time Analytics</h3>
              <p className="text-purple-700 mt-2">
                Instant feedback and detailed performance metrics to track and enhance your progress.
              </p>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-purple-600 text-white mb-4">
                <Briefcase className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900">Industry-Specific Prep</h3>
              <p className="text-purple-700 mt-2">
                Comprehensive coverage of technical, behavioral, and role-specific interview questions.
              </p>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-purple-600 text-white mb-4">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900">Mock Interview Simulations</h3>
              <p className="text-purple-700 mt-2">
                Practice realistic interviews with AI-driven evaluators to build confidence.
              </p>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-purple-600 text-white mb-4">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900">Team Collaboration Tools</h3>
              <p className="text-purple-700 mt-2">
                Manage and monitor team progress with intuitive dashboards for organizations.
              </p>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-purple-600 text-white mb-4">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900">Secure & Private</h3>
              <p className="text-purple-700 mt-2">
                Enterprise-grade security with end-to-end encryption for your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-20 md:py-32 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Your Roadmap
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-purple-900 sm:text-5xl">
              Master Interviews in 3 Steps
            </h2>
            <p className="text-lg text-purple-700 max-w-3xl mx-auto leading-relaxed">
              Follow our proven process to prepare efficiently and excel in your interviews.
            </p>
          </div>
          <div className="grid gap-12 md:grid-cols-3 max-w-6xl mx-auto">
            <div className="relative flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-2xl shadow-lg border border-purple-100 transform hover:scale-105 transition-all duration-300">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white text-xl font-bold">
                  1
                </div>
              </div>
              <h3 className="text-xl font-semibold text-purple-900">Create Your Profile</h3>
              <p className="text-purple-700">
                Sign up and customize your profile with your career goals and skill focus.
              </p>
              <ul className="space-y-3 text-sm text-purple-700">
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  Seamless onboarding
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  Personalized dashboard
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  Skill profiling
                </li>
              </ul>
            </div>
            <div className="relative flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-2xl shadow-lg border border-purple-100 transform hover:scale-105 transition-all duration-300">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white text-xl font-bold">
                  2
                </div>
              </div>
              <h3 className="text-xl font-semibold text-purple-900">Practice with AI</h3>
              <p className="text-purple-700">Engage in tailored assessments and mock interviews powered by AI.</p>
              <ul className="space-y-3 text-sm text-purple-700">
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  Adaptive questions
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  Real-time feedback
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  Scenario-based prep
                </li>
              </ul>
            </div>
            <div className="relative flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-2xl shadow-lg border border-purple-100 transform hover:scale-105 transition-all duration-300">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white text-xl font-bold">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold text-purple-900">Refine & Succeed</h3>
              <p className="text-purple-700">Analyze performance and follow AI-driven recommendations to improve.</p>
              <ul className="space-y-3 text-sm text-purple-700">
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  In-depth analytics
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  Targeted insights
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                  Progress tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="w-full py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-200/30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-t-lg">
                  <div className="h-3 w-3 rounded-full bg-purple-400"></div>
                  <div className="h-3 w-3 rounded-full bg-purple-300"></div>
                  <div className="h-3 w-3 rounded-full bg-purple-200"></div>
                  <div className="ml-2 text-sm text-purple-600">{PLATFORM_NAME} Dashboard</div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-purple-50 p-4 rounded-xl flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold text-purple-800">95%</div>
                      <div className="text-sm text-purple-600">Performance Score</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold text-purple-800">20</div>
                      <div className="text-sm text-purple-600">Tests Completed</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold text-purple-800">8</div>
                      <div className="text-sm text-purple-600">Skills Mastered</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-purple-800">Progress Overview</div>
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-purple-700">Technical Skills</span>
                        <span className="text-sm text-purple-600">75%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-3">
                        <div className="bg-purple-600 h-3 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-purple-700">Behavioral Skills</span>
                        <span className="text-sm text-purple-600">90%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-3">
                        <div className="bg-purple-600 h-3 rounded-full" style={{ width: "90%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-purple-800">Recent Performance</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-4 rounded-xl">
                        <div className="text-sm text-purple-700 mb-2">Coding Interview</div>
                        <div className="flex items-center justify-center">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#E9D5FF"
                                strokeWidth="3"
                              />
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 11.292 4.691
                                  a 15.9155 15.9155 0 0 1 4.691 11.292"
                                fill="none"
                                stroke="#8B5CF6"
                                strokeWidth="3"
                                strokeDasharray="85 100"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-purple-800 font-bold">
                              85%
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-xl">
                        <div className="text-sm text-purple-700 mb-2">Mock Interview</div>
                        <div className="flex items-center justify-center">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#E9D5FF"
                                strokeWidth="3"
                              />
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 11.292 4.691
                                  a 15.9155 15.9155 0 0 1 4.691 11.292"
                                fill="none"
                                stroke="#8B5CF6"
                                strokeWidth="3"
                                strokeDasharray="92 100"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-purple-800 font-bold">
                              92%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                <Sparkles className="mr-2 h-4 w-4" />
                Platform Preview
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-purple-900 sm:text-5xl">
                Your Ultimate Interview Companion
              </h2>
              <p className="text-lg text-purple-700 leading-relaxed">
                Experience a comprehensive platform that equips you with tools to conquer any interview challenge with
                confidence.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-900">Tailored Learning Paths</h3>
                    <p className="text-purple-700">Customized plans to accelerate your growth.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-900">AI-Powered Questions</h3>
                    <p className="text-purple-700">Relevant, up-to-date questions for real-world prep.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-900">Progress Tracking</h3>
                    <p className="text-purple-700">Detailed analytics to monitor and improve.</p>
                  </div>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-purple-600 text-white hover:bg-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center rounded-full bg-purple-900 px-4 py-2 text-sm font-semibold text-white">
              <Award className="mr-2 h-4 w-4" />
              Take the First Step
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Ready to Shine in Your Interviews?
            </h2>
            <p className="text-lg text-purple-100 max-w-3xl mx-auto leading-relaxed">
              Join a community of professionals who have elevated their interview skills with {PLATFORM_NAME}. Start
              your free trial today and unlock your potential.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
              >
                <Link href="/register">
                  Try for Free
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-purple-900 transform hover:scale-105 transition-all duration-200"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 bg-purple-50 border-t border-purple-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
                <span className="text-xl font-bold text-purple-800">{PLATFORM_NAME}</span>
              </div>
              <p className="text-purple-700 mb-4 max-w-sm leading-relaxed">
                Revolutionizing interview preparation with AI-driven tools to help professionals achieve career success.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-purple-600 hover:text-purple-800 transition-colors duration-200">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-purple-600 hover:text-purple-800 transition-colors duration-200">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-purple-100 text-center text-purple-700">
            <p>© 2025 {PLATFORM_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
