import type { Metadata } from "next";
import CodePreviewTool from "@/sections/CodePreviewTool";

export const metadata: Metadata = {
  title: "Live Code Preview Tool",
  description:
    "A free tool to write and preview HTML, CSS, and JavaScript code in real-time with error handling.",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 mb-2">
            Live Code Preview Tool
          </h1>
          <p className="text-lg text-gray-600">
            Write HTML, CSS, and JavaScript code and see the result instantly.
          </p>
        </header>
        <CodePreviewTool />
        <div>
          <br className="ProseMirror-trailingBreak" />
          <br className="ProseMirror-trailingBreak" />
          <div
            contentEditable="false"
            role="textbox"
            translate="no"
            className="tiptap ProseMirror"
          >
            <p>
              🚀 <strong>Try Our Live Code Preview Tool Now!</strong> 🎉
            </p>
            <p>
              Are you ready to{" "}
              <strong>supercharge your coding experience</strong>? Dive into our{" "}
              <strong>Live Code Preview Tool</strong> and watch your HTML, CSS,
              and JavaScript <strong>spring to life in real-time</strong>!
              Whether you’re a beginner just starting out or a seasoned
              developer tackling tricky bugs, this tool is your{" "}
              <strong>ultimate coding playground</strong>. 🛠️
            </p>
            <p>
              <br className="ProseMirror-trailingBreak" />
            </p>
            <p>
              ✨ <strong>Features You’ll Love:</strong>
            </p>
            <ul className="list-disc pl-6">
              <li>
                <p>
                  <strong>Live Preview</strong>: See your code render instantly
                  as you type—no delays, just pure coding magic!
                </p>
              </li>
              <li>
                <p>
                  <strong>Error Handling</strong>: Get crystal-clear, actionable
                  error messages the moment something goes wrong.
                </p>
              </li>
              <li>
                <p>
                  <strong>Console Output</strong>: Debug like a pro with
                  console.log and outputs displayed right where you need them.
                </p>
              </li>
              <li>
                <p>
                  <strong>Sleek UI</strong>: Code in style with a modern,
                  intuitive design featuring neumorphic vibes and bold colors.
                </p>
              </li>
            </ul>
            <p>
              <br className="ProseMirror-trailingBreak" />
            </p>
            <p>
              💡 <strong>Why It’s a Game-Changer:</strong>
            </p>
            <ul className="list-disc pl-6">
              <li>
                <p>
                  <strong>Beginner-Friendly</strong>: Perfect for learning,
                  experimenting, and mastering code in a safe, sandboxed space.
                </p>
              </li>
              <li>
                <p>
                  <strong>Developer-Ready</strong>: Test and debug efficiently
                  with real-time feedback and a powerful console at your
                  fingertips.
                </p>
              </li>
              <li>
                <p>
                  <strong>Zero Setup</strong>: Jump straight in—no downloads, no
                  installs, just pure coding freedom!
                </p>
              </li>
            </ul>
            <p>
              🔍 <strong>SEO-Friendly Tip</strong>: Searching for a{" "}
              <strong>&quot;live code preview&quot;</strong>,{" "}
              <strong>&quot;HTML CSS JS playground&quot;</strong>, or{" "}
              <strong>&quot;real-time code testing&quot;</strong>? You’ve landed
              on the perfect tool!
            </p>
            <p>
              <br className="ProseMirror-trailingBreak" />
            </p>
            <p>
              👉 <strong>Get Started Now</strong>: Try it today and discover how{" "}
              <strong>easy</strong>, <strong>fun</strong>, and{" "}
              <strong>powerful</strong> coding can be! Your next big idea is
              just a few lines away. 💻✨
            </p>
            <hr contentEditable="false" />
            <p>
              <br className="ProseMirror-trailingBreak" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
