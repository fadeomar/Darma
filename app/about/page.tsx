"use client";
import { motion } from "framer-motion";

function AboutPage() {
  const resourceSections = [
    {
      title: "📚 Learning & Development",
      items: [
        {
          name: "freeCodeCamp",
          desc: "4,000+ hour curriculum with certifications",
          link: "https://www.freecodecamp.org/",
          image:
            "https://images.unsplash.com/photo-1550439062-609e1531270e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        },
        {
          name: "Frontend Mentor",
          desc: "Real-world frontend challenges with solutions",
          link: "https://www.frontendmentor.io/",
          image:
            "https://images.pexels.com/photos/270632/pexels-photo-270632.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        },
        {
          name: "Scrimba",
          desc: "Interactive coding screencasts",
          link: "https://scrimba.com/",
          image:
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        },
      ],
    },
    {
      title: "🛠️ Development Tools",
      items: [
        {
          name: "CodeSandbox",
          desc: "Online IDE for web development",
          link: "https://codesandbox.io/",
          image:
            "https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        },
        {
          name: "CSS Generators",
          desc: "Shadows, gradients, clip-path tools",
          link: "#",
          image:
            "https://images.unsplash.com/photo-1581276879432-15e50529f34b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        },
        {
          name: "StackBlitz",
          desc: "Instant fullstack development environment",
          link: "https://stackblitz.com/",
          image:
            "https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        },
      ],
    },
    {
      title: "💡 Inspiration & Community",
      items: [
        {
          name: "Dev Community",
          desc: "Global developer discussions & articles",
          link: "https://dev.to/",
          image:
            "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        },
        {
          name: "GitHub Explore",
          desc: "Discover trending repositories",
          link: "https://github.com/explore",
          image:
            "https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        },
        {
          name: "CSS-Tricks",
          desc: "Daily articles about web design",
          link: "https://css-tricks.com/",
          image:
            "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        },
      ],
    },
    {
      title: "🎥 YouTube Channels",
      items: [
        {
          name: "Fireship",
          desc: "Quick tech explanations & tutorials",
          link: "https://www.youtube.com/c/Fireship",
          image: "https://i.ytimg.com/vi/7Xy0L6qSYLc/maxresdefault.jpg",
        },
        {
          name: "Traversy Media",
          desc: "Full project tutorials",
          link: "https://www.youtube.com/c/TraversyMedia",
          image: "https://i.ytimg.com/vi/hdI2bqOjy3c/maxresdefault.jpg",
        },
        {
          name: "Kevin Powell",
          desc: "CSS deep dives & best practices",
          link: "https://www.youtube.com/kepowob",
          image: "https://i.ytimg.com/vi/sjfG5Oo40yg/maxresdefault.jpg",
        },
      ],
    },
    {
      title: "🎨 Design Resources",
      items: [
        {
          name: "Undraw Illustrations",
          desc: "Open-source illustrations",
          link: "https://undraw.co/",
          image:
            "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        },
        {
          name: "Coolors",
          desc: "Color palette generator",
          link: "https://coolors.co/",
          image:
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        },
        {
          name: "UI Movement",
          desc: "Best UI design inspiration",
          link: "https://uimovement.com/",
          image:
            "https://images.unsplash.com/photo-1511376777868-611b54f68947?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Hero Section */}
      <section className="text-center py-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-6"
        >
          Your Ultimate Developer Toolkit
        </motion.h1>
        <p className="text-lg text-gray-400 mt-4 max-w-2xl mx-auto">
          A carefully curated collection of resources, tools, and learning
          materials for developers at all levels. Bookmark this page as your
          go-to reference!
        </p>
      </section>

      {/* Value Proposition */}
      <section className="py-12 max-w-6xl mx-auto text-center">
        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-semibold mb-6">
            Why Bookmark This Page?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "100+ Resources",
                text: "Hand-picked tools & references",
              },
              {
                title: "Daily Updated",
                text: "Fresh content added regularly",
              },
              {
                title: "Community Verified",
                text: "Tested by developers worldwide",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-700 p-6 rounded-xl"
              >
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Grid */}
      {resourceSections.map((section, index) => (
        <section key={index} className="py-12 max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-semibold">{section.title}</h3>
            <p className="text-gray-400 mt-2">
              Essential tools for your workflow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.items.map((item, i) => (
              <motion.a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                className="group block bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <div className="h-48 bg-gray-700 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-semibold mb-2">{item.name}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      ))}

      {/* Bookmark Callout */}
      <section className="py-16 text-center max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Save This Resource Hub!</h2>
          <p className="text-gray-200 mb-6">
            Press <kbd className="px-3 py-1 bg-gray-900 rounded-md">⌘ + D</kbd>
            to bookmark this page and access these resources anytime
          </p>
          <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Share with Team
          </button>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold text-center mb-8">
          Getting the Most from Darama
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">For Learners</h3>
            <ul className="space-y-3 text-gray-400">
              <li>✅ Start with fundamentals path</li>
              <li>✅ Practice with interactive code</li>
              <li>✅ Join community challenges</li>
            </ul>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">For Developers</h3>
            <ul className="space-y-3 text-gray-400">
              <li>🚀 Explore component library</li>
              <li>🚀 Contribute to open source</li>
              <li>🚀 Use generators in projects</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold text-center mb-8">
          What Developers Say
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              text: "This resource hub saved me hours of searching. Everything I need in one place!",
              author: "Sarah, Frontend Developer",
            },
            {
              text: "The curated learning paths helped me transition into web development smoothly.",
              author: "Mike, Career Switcher",
            },
          ].map((testimonial, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-xl">
              <p className="text-gray-300 mb-4">
                &quot;{testimonial.text}&quot;
              </p>
              <p className="text-gray-400 font-medium">
                — {testimonial.author}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-6">Need Help?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="font-semibold mb-2">FAQs</h3>
            <p className="text-gray-400 text-sm">Common questions answered</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="font-semibold mb-2">Discord</h3>
            <p className="text-gray-400 text-sm">Live community support</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="font-semibold mb-2">Guides</h3>
            <p className="text-gray-400 text-sm">Step-by-step tutorials</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
