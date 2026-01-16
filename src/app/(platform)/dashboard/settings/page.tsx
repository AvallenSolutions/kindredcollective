'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Bell, Shield, CreditCard, Trash2 } from 'lucide-react'
import { Button, Input, Label, Card, CardContent, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'billing'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@demodrinksco.com',
    company: 'Demo Drinks Co.',
    jobTitle: 'Founder',
    bio: 'Building the next great drinks brand.',
    location: 'London',
  })

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b-3 border-black">
        <div className="section-container py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-bold mb-4 hover:text-cyan"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold">Account Settings</h1>
        </div>
      </section>

      {/* Content */}
      <section className="section-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left font-bold text-sm border-2 transition-colors',
                    activeTab === tab.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-200 hover:border-black'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-6">
                    Profile Information
                  </h2>
                  <form className="space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 bg-cyan border-3 border-black flex items-center justify-center">
                        <span className="font-display text-3xl font-bold">
                          {formData.firstName.charAt(0)}
                          {formData.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          Change Photo
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG. Max 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) =>
                            setFormData({ ...formData, company: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={formData.jobTitle}
                          onChange={(e) =>
                            setFormData({ ...formData, jobTitle: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    </div>

                    <div className="pt-4">
                      <Button>Save Changes</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-6">
                    Notification Preferences
                  </h2>
                  <div className="space-y-6">
                    {[
                      {
                        title: 'New offers from suppliers',
                        description: 'Get notified when suppliers you follow post new offers',
                      },
                      {
                        title: 'Event reminders',
                        description: 'Receive reminders for events you\'re attending',
                      },
                      {
                        title: 'Community updates',
                        description: 'News and updates from the Kindred community',
                      },
                      {
                        title: 'Marketing emails',
                        description: 'Promotional content and newsletters',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200"
                      >
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-300 peer-checked:bg-cyan border-2 border-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-2 after:border-black after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'privacy' && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-6">
                    Privacy Settings
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200">
                      <div>
                        <p className="font-bold">Public profile</p>
                        <p className="text-sm text-gray-600">
                          Allow others to see your profile in the member directory
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-cyan border-2 border-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-2 after:border-black after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200">
                      <div>
                        <p className="font-bold">Show on event attendee lists</p>
                        <p className="text-sm text-gray-600">
                          Display your name when RSVPing to events
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-cyan border-2 border-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-2 after:border-black after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="font-display font-bold text-coral mb-4">
                        Danger Zone
                      </h3>
                      <Button variant="outline" className="border-coral text-coral hover:bg-coral hover:text-white">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'billing' && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-bold mb-6">
                    Billing & Subscription
                  </h2>
                  <div className="p-6 bg-lime/20 border-3 border-lime mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-bold">Current Plan</span>
                      <Badge variant="lime">Free</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      You&apos;re on the free plan. Upgrade to access premium features.
                    </p>
                  </div>
                  <Button size="lg" className="w-full">
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
