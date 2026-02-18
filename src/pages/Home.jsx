import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Bell,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Zap,
  Heart,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: "Smart Assignment Tracking",
      description: "Keep all your homework organized in one place with due dates, priorities, and status tracking.",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Sparkles,
      title: "AI Tutor Assistance",
      description: "Get personalized help with your homework. Our AI tutor guides you through problems step-by-step.",
      gradient: "from-amber-500 to-amber-600",
    },
    {
      icon: Users,
      title: "Class Management",
      description: "Organize by class with teacher contact info, schedules, and current grades all in one place.",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Never miss a deadline with email reminders for upcoming and overdue assignments.",
      gradient: "from-rose-500 to-rose-600",
    },
    {
      icon: FileSpreadsheet,
      title: "Schoology Import",
      description: "Upload screenshots from Schoology and let AI extract assignments, classes, and teacher info automatically.",
      gradient: "from-violet-500 to-violet-600",
    },
    {
      icon: Users,
      title: "Parent & Student Accounts",
      description: "Parents can monitor multiple students, while students manage their own workload independently.",
      gradient: "from-emerald-500 to-emerald-600",
    },
  ];

  const stats = [
    { icon: CheckCircle2, label: "Assignments Tracked", value: "10K+" },
    { icon: Sparkles, label: "AI Tutoring Sessions", value: "5K+" },
    { icon: Users, label: "Active Students", value: "2K+" },
    { icon: Heart, label: "Parent Satisfaction", value: "98%" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 py-20 px-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-white/80 backdrop-blur-sm text-amber-600 border-amber-200 px-4 py-1">
              <Zap className="h-3 w-3 mr-1" />
              Smart Homework Management
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                Academic Journey
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Stay organized, get AI-powered help, and never miss a deadline. 
              The complete homework management solution for students and parents.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to={createPageUrl("Dashboard")}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all text-lg px-8"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to={createPageUrl("Tutor")}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-slate-200 hover:border-amber-200 hover:bg-amber-50 text-lg px-8"
                >
                  Try AI Tutor
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Feature Preview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: CheckCircle2, text: "Track Assignments", color: "blue" },
              { icon: Sparkles, text: "AI Homework Help", color: "amber" },
              { icon: Calendar, text: "Never Miss Deadlines", color: "purple" },
            ].map((item, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border-slate-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-${item.color}-100 to-${item.color}-200 flex items-center justify-center`}>
                    <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                  </div>
                  <span className="font-semibold text-slate-700">{item.text}</span>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-amber-50 text-amber-600 border-amber-200 px-4 py-1">
              Everything You Need
            </Badge>
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Powerful Features for Academic Success
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From AI-powered tutoring to smart organization, StudyTrack has everything students need to excel.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-amber-50 to-rose-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Loved by Students & Parents
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "StudyTrack helped me stay organized and my grades improved significantly. The AI tutor is like having help whenever I need it!",
                author: "Sarah M.",
                role: "High School Student",
              },
              {
                quote: "As a parent, I love being able to see all my kids' assignments and grades in one place. It's so much easier to help them stay on track.",
                author: "Jennifer K.",
                role: "Parent of 3",
              },
              {
                quote: "The Schoology import feature saved me hours. Just snap a photo and everything is organized automatically!",
                author: "Alex T.",
                role: "College Student",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-slate-100 h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-4 w-4 text-amber-400">⭐</div>
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="font-semibold text-slate-800">{testimonial.author}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Study Routine?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of students who are already succeeding with StudyTrack.
            </p>
            <Link to={createPageUrl("Dashboard")}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all text-lg px-8"
              >
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">StudyTrack</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2026 StudyTrack. Empowering students to achieve their best.
          </p>
        </div>
      </footer>
    </div>
  );
}