"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen, ChevronRight, Search, X, Copy, CheckCircle2,
  Zap, Globe, User, Trophy, Gift, Compass, ArrowRight,
  ExternalLink, Menu, ChevronDown, Star, Users, GraduationCap,
  Flame, Shield, Heart, Award, Bell, HelpCircle, Rocket,
  MapPin, Hash, MessageCircle, Layers,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Callout({ type = "info", children }: { type?: "info" | "warn" | "tip" | "success"; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    info:    "bg-accent/[0.07] border-accent/30",
    warn:    "bg-amber-500/[0.07] border-amber-500/30",
    tip:     "bg-purple-500/[0.07] border-purple-500/30",
    success: "bg-emerald-500/[0.07] border-emerald-500/30",
  };
  const icons: Record<string, string> = { info: "ℹ️", warn: "⚠️", tip: "💡", success: "✅" };
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 my-4 ${styles[type]}`}>
      <span className="shrink-0 mt-0.5 text-sm">{icons[type]}</span>
      <div className="text-sm text-ink/80 leading-relaxed">{children}</div>
    </div>
  );
}

function StepList({ steps }: { steps: { title: string; desc: string }[] }) {
  return (
    <div className="space-y-3 my-4">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl bg-ink/[0.03] border border-ink/[0.06]">
          <div className="w-7 h-7 rounded-full bg-accent/20 text-accent-fg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </div>
          <div>
            <div className="text-sm font-bold text-ink mb-0.5">{step.title}</div>
            <div className="text-sm text-ink-3 leading-relaxed">{step.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardGrid({ cards }: { cards: { emoji: string; title: string; desc: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
      {cards.map((card, i) => (
        <div key={i} className="p-4 rounded-xl bg-ink/[0.03] border border-ink/[0.06]">
          <div className="text-2xl mb-2">{card.emoji}</div>
          <div className="text-sm font-bold text-ink mb-1">{card.title}</div>
          <div className="text-xs text-ink-3 leading-relaxed">{card.desc}</div>
        </div>
      ))}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-ink/[0.08]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-ink/[0.08] bg-ink/[0.03]">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-2.5 font-bold text-ink-3 uppercase tracking-wider text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-ink/[0.04] last:border-0 hover:bg-ink/[0.02]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-ink-3 leading-relaxed">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-heading font-bold text-ink mt-8 mb-3 pb-2 border-b border-ink/[0.06]">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-ink mt-5 mb-2">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-3 leading-relaxed mb-3">{children}</p>;
}
function UL({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-2 mb-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-ink-3">
          <ChevronRight className="w-3.5 h-3.5 text-accent-fg shrink-0 mt-0.5" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Doc content ───────────────────────────────────────────────────────────────

interface Section { id: string; title: string; content: React.ReactNode; }
interface DocCategory { id: string; label: string; icon: React.ElementType; color: string; sections: Section[]; }

const DOCS: DocCategory[] = [

  // ── Welcome ─────────────────────────────────────────────────────────────────
  {
    id: "welcome",
    label: "Welcome",
    icon: Heart,
    color: "text-accent-fg",
    sections: [
      {
        id: "what-is-bcl",
        title: "What is BCL Onchain?",
        content: (
          <>
            <P>BCL Onchain is the official community platform for <strong>Blockchain Club LAUTECH</strong>. It is the place where members learn, participate, contribute, and get recognized for their involvement in the club's activities.</P>
            <P>The name "Onchain" reflects the platform's use of blockchain technology to record your achievements. When you earn badges or register a community name, those records live on the blockchain — meaning they belong to you and can be verified by anyone.</P>

            <Callout type="success">You do not need to understand blockchain technology to use BCL Onchain. If you can create a profile and complete activities, the platform handles everything else.</Callout>

            <H2>What can you do here?</H2>
            <CardGrid cards={[
              { emoji: "🎓", title: "Learn blockchain", desc: "Follow learning tracks designed for beginners all the way up to advanced developers." },
              { emoji: "🏆", title: "Complete quests", desc: "Earn XP by completing community activities, building projects, and attending events." },
              { emoji: "🪪", title: "Build your identity", desc: "Create a profile that shows your contributions, skills, and achievements." },
              { emoji: "🌐", title: "Claim your .bcl name", desc: "Get a unique community name like yourname.bcl that represents you in the club." },
              { emoji: "🏅", title: "Earn achievement badges", desc: "Receive blockchain-based badges when you reach milestones in the community." },
              { emoji: "📈", title: "Grow your reputation", desc: "Build a verified record of your work that you can use for opportunities." },
            ]} />

            <H2>Why BCL built this</H2>
            <P>Before BCL Onchain, tracking who was contributing to the club relied on WhatsApp groups, attendance registers, and informal records. There was no easy way to recognize consistent contributors, verify completed work, or give members a meaningful record of their growth.</P>
            <P>BCL Onchain changes that. Every completed activity is verified and recorded. Your progress is visible on your profile. Your achievements are yours to keep — even after you graduate.</P>

            <Callout type="tip">The goal is to reward genuine contributions. Completing a real project earns more XP than sharing a post. Quality and effort matter.</Callout>
          </>
        ),
      },
      {
        id: "who-is-it-for",
        title: "Who is it for?",
        content: (
          <>
            <P>BCL Onchain is built for every student in Blockchain Club LAUTECH, regardless of your experience level.</P>

            <H3>If you are new to blockchain</H3>
            <P>Start with the beginner learning tracks and introductory quests. You do not need to know how to code. There are community quests, content creation activities, and event-based tasks that anyone can complete.</P>

            <H3>If you are a developer</H3>
            <P>Take on developer quests: build DApps, write and deploy smart contracts, complete security exercises, or contribute to club projects. The more substantial your work, the more XP you earn.</P>

            <H3>If you are a community contributor</H3>
            <P>Create educational content, help onboard new members, participate in discussions, organize events, or represent BCL at hackathons. There are quests for all of these.</P>

            <H3>If you are an experienced member</H3>
            <P>Higher-level quests, guild leadership, hackathon participation, and ecosystem activities are all part of the platform. As you build your profile, it becomes a portfolio of your work in the club.</P>

            <Callout type="info">Every member starts at the same place. What separates members over time is the work they put in.</Callout>
          </>
        ),
      },
    ],
  },

  // ── Getting Started ──────────────────────────────────────────────────────────
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Rocket,
    color: "text-purple-500",
    sections: [
      {
        id: "what-you-need",
        title: "What you need to join",
        content: (
          <>
            <P>Joining BCL Onchain requires a Web3 wallet. A wallet is a free app that gives you a blockchain address — think of it like a username and password, but you own it completely.</P>

            <H3>Recommended wallets</H3>
            <CardGrid cards={[
              { emoji: "🦊", title: "MetaMask", desc: "The most popular choice. Available as a browser extension and mobile app. Good for beginners." },
              { emoji: "🌈", title: "Rainbow", desc: "A clean mobile-first wallet. Great if you prefer using your phone." },
              { emoji: "🔵", title: "Coinbase Wallet", desc: "Made by Coinbase. Easy to set up and beginner-friendly." },
              { emoji: "🔗", title: "WalletConnect", desc: "Lets you connect many different mobile wallets by scanning a QR code." },
            ]} />

            <Callout type="warn">Your wallet is your identity on BCL Onchain. Keep your recovery phrase (seed phrase) safe and private. BCL will never ask for it. Anyone who does is trying to scam you.</Callout>

            <H3>Do I need cryptocurrency?</H3>
            <P>For most activities on the platform, no. Completing quests, earning XP, updating your profile, and most other actions are free. The only time you need a small amount of tokens is when registering a .bcl domain name, and even then the network covers transaction fees.</P>
          </>
        ),
      },
      {
        id: "joining",
        title: "Joining the platform",
        content: (
          <>
            <P>Here is how to get started from scratch.</P>

            <StepList steps={[
              {
                title: "Install a wallet",
                desc: "Download MetaMask or another supported wallet on your phone or browser. Follow the setup instructions and save your recovery phrase somewhere safe — not in a note on your phone.",
              },
              {
                title: "Connect your wallet",
                desc: "Click 'Connect Wallet' in the top navigation bar. Choose your wallet from the list. Your wallet app will open and ask you to approve the connection — tap Approve or Connect.",
              },
              {
                title: "Sign the verification message",
                desc: "After connecting, your wallet will ask you to sign a message. This proves you own the wallet. It is not a transaction and costs nothing. Tap Sign.",
              },
              {
                title: "Create your profile",
                desc: "You will be taken to your profile page. Choose a username, upload a photo or pick an emoji, write a short bio, and add any skills you have. Your username is your identity on the platform.",
              },
              {
                title: "Explore and start",
                desc: "Head to the Quests page to find activities to complete, or visit the Learn section to start a learning track. Your dashboard shows your progress.",
              },
            ]} />

            <Callout type="success">The whole process takes about five minutes. Once your profile is set up, you are part of the community.</Callout>

            <H3>What is the sign-in message?</H3>
            <P>When you sign the message your wallet shows you, you are proving to the platform that you control that wallet address. It is a security step, not a payment. Your wallet will show you the text of the message clearly — it will mention BCL Onchain and your wallet address. If anything looks unfamiliar, do not sign.</P>
          </>
        ),
      },
      {
        id: "your-profile",
        title: "Setting up your profile",
        content: (
          <>
            <P>Your profile is your identity card on BCL Onchain. It shows other members who you are, what you have accomplished, and what skills you bring to the community.</P>

            <Table
              headers={["Profile section", "What to put here"]}
              rows={[
                ["Username", "Your community handle — 3 to 32 characters, letters and numbers only. Choose something you will be happy with long term."],
                ["Photo or avatar", "Upload a photo of yourself or choose from the emoji options. Your avatar appears on your profile, the leaderboard, and activity feeds."],
                ["Bio", "A short description of who you are and what you are interested in. Keep it to two or three sentences."],
                ["Role", "Choose the role that best describes you — builder, developer, designer, researcher, community, student, or another option from the list."],
                ["Location", "Your city or institution, e.g. Ogbomoso, LAUTECH."],
                ["Skills", "Add up to 12 skill tags, such as Solidity, React, Python, or Community."],
                ["Social links", "Optionally link your Twitter/X, GitHub, and personal website."],
              ]}
            />

            <Callout type="tip">You must set a username before you can submit quest proofs or register a .bcl domain. Do this first.</Callout>
          </>
        ),
      },
    ],
  },

  // ── Quests ───────────────────────────────────────────────────────────────────
  {
    id: "quests",
    label: "Quests",
    icon: Compass,
    color: "text-amber-500",
    sections: [
      {
        id: "quests-explained",
        title: "What are quests?",
        content: (
          <>
            <P>Quests are activities set by BCL admins that you can complete to earn XP and build your community record. Think of them as assignments — but more interesting, more flexible, and tied directly to real blockchain skills and community contributions.</P>

            <P>Quests are organized into categories to help you find what suits you.</P>

            <Table
              headers={["Category", "Examples"]}
              rows={[
                ["Community", "Complete onboarding, participate in club discussions, help new members join."],
                ["Learning", "Study blockchain fundamentals, complete a quiz, follow a course track."],
                ["Developer", "Build a DApp, deploy a smart contract, submit a GitHub project."],
                ["Social media", "Share club content, write a thread about something you learned, create educational posts."],
                ["Content creation", "Write a blog post, record a tutorial video, design club materials."],
                ["Events", "Attend a workshop, RSVP to a masterclass, participate in a community session."],
                ["Hackathons", "Join the Confluence Hackathon, submit a project, collaborate with other members."],
                ["Partner activities", "Complete activities with BCL's ecosystem partners."],
                ["Beginner tasks", "First steps for new members — wallet setup, profile creation, introductory learning."],
              ]}
            />

            <Callout type="info">Admins create and manage all quests. Members cannot create their own quests. This keeps the activity list focused and ensures XP reflects real contributions.</Callout>
          </>
        ),
      },
      {
        id: "completing-quests",
        title: "How to complete a quest",
        content: (
          <>
            <StepList steps={[
              {
                title: "Find a quest",
                desc: "Go to the Quests page. Browse the available activities and filter by category. Each quest shows its XP reward, deadline, and what you need to do.",
              },
              {
                title: "Do the work",
                desc: "Complete the actual activity described in the quest. This might mean learning something, building a project, attending an event, or creating content.",
              },
              {
                title: "Submit your proof",
                desc: "Come back to the quest page and click Submit. Attach the evidence that shows you completed it — a GitHub link, a transaction hash from the blockchain, a URL, written explanation, or an uploaded screenshot.",
              },
              {
                title: "Wait for verification",
                desc: "The platform or a BCL admin reviews your submission. For some quests this is automatic; for others it takes a short time for a human to check.",
              },
              {
                title: "Receive your XP",
                desc: "Once your submission is verified, XP is added to your account. Your level and leaderboard position update automatically.",
              },
            ]} />

            <H2>What counts as proof?</H2>
            <P>Different quests accept different types of evidence. The quest description always tells you what to submit.</P>
            <Table
              headers={["Proof type", "When you would use it"]}
              rows={[
                ["GitHub link", "For development quests — link to the repository containing your project."],
                ["Transaction hash", "For on-chain quests — paste the transaction ID from the blockchain explorer to prove you completed an action on-chain."],
                ["URL", "For content or social quests — link to your blog post, tweet, video, or published work."],
                ["Written explanation", "For learning quests — describe what you learned or how you approached a problem."],
                ["Screenshot", "For event or community quests — upload an image showing your participation."],
              ]}
            />
          </>
        ),
      },
      {
        id: "quest-status",
        title: "Tracking your submissions",
        content: (
          <>
            <P>After submitting, you can see the status of every quest in your profile under <strong>Quest History</strong>. Here is what each status means.</P>

            <Table
              headers={["Status", "What it means"]}
              rows={[
                ["Not started", "You have not submitted anything for this quest yet."],
                ["Submitted", "You have sent your evidence. The platform is reviewing it."],
                ["Under review", "A BCL admin is checking your submission."],
                ["Verified ✅", "Your submission was approved. XP has been added to your account."],
                ["Rejected", "Your submission was not accepted. You will see the reason. You may be able to resubmit."],
                ["Expired", "The quest deadline passed before your submission was verified."],
              ]}
            />

            <Callout type="warn">If your submission is rejected, read the reason carefully. Most rejections are because the proof does not clearly show the completed work. Resubmit with better evidence if allowed.</Callout>

            <H3>How is my work verified?</H3>
            <P>The platform uses two approaches depending on the quest type.</P>
            <UL items={[
              "Automatic: For on-chain quests, the system checks the blockchain directly to confirm your transaction went through or that you own a specific token.",
              "Manual: For learning, content, and community quests, a BCL admin reviews your submission and approves or rejects it with a reason.",
            ]} />
          </>
        ),
      },
    ],
  },

  // ── XP & Levels ──────────────────────────────────────────────────────────────
  {
    id: "xp-levels",
    label: "XP & Levels",
    icon: Zap,
    color: "text-yellow-500",
    sections: [
      {
        id: "xp-explained",
        title: "What is XP?",
        content: (
          <>
            <P>XP stands for Experience Points. Every time you complete a verified activity on BCL Onchain, you earn XP. Your XP total is your reputation score — it reflects how much you have contributed to the community.</P>
            <P>XP is <strong>not a cryptocurrency and cannot be bought or sold.</strong> The only way to earn it is by completing real activities.</P>

            <H2>Ways to earn XP</H2>
            <Table
              headers={["Activity", "XP"]}
              rows={[
                ["Complete a verified quest", "10 – 500 XP depending on the quest"],
                ["Daily streak bonus", "+20 XP once per day when you visit and claim it"],
                ["Daily Web3 quiz", "+50 XP once per day for answering the community question"],
                ["Reach a new level", "Milestone recognition (achievement badge)"],
              ]}
            />

            <Callout type="tip">The daily streak is worth doing every day. Over a month of consistent engagement, that adds up to 600 XP — equivalent to several quests.</Callout>
          </>
        ),
      },
      {
        id: "levels",
        title: "Levels and progression",
        content: (
          <>
            <P>As your XP grows, you move through community levels. Each level represents a stage in your journey as a BCL member.</P>

            <Table
              headers={["Level", "Title", "What it represents"]}
              rows={[
                ["1", "Newcomer", "You have joined and started your journey."],
                ["2", "Explorer", "You are actively engaging with the community and completing early quests."],
                ["3", "Pioneer Guildsman", "You have built a meaningful contribution record across multiple areas."],
                ["4", "Pioneer Elite", "You are a consistent, high-quality contributor to the club."],
                ["5+", "Legend", "You have made exceptional contributions to BCL Onchain."],
              ]}
            />

            <H3>What happens when you level up?</H3>
            <P>When your XP crosses a level threshold, two things happen automatically.</P>
            <UL items={[
              "Your profile and leaderboard position are updated to show your new level.",
              "The platform queues an achievement badge (NFT) for your wallet — a permanent record of reaching that milestone.",
            ]} />

            <Callout type="success">Levelling up is based entirely on XP you have earned through verified activities. There is no shortcut.</Callout>

            <H3>Streaks</H3>
            <P>A streak counts how many consecutive days you have been active on the platform. Keeping a streak going shows consistent engagement — and earns you bonus XP each day.</P>
            <P>If you maintain a 7-day streak or longer, your profile shows the <strong>Consistency Elite</strong> badge. Streaks also appear on the leaderboard as an additional signal of your engagement.</P>
          </>
        ),
      },
      {
        id: "daily-activities",
        title: "Daily activities",
        content: (
          <>
            <P>Two bonus activities are available every calendar day. They reset at midnight.</P>

            <H3>Daily streak claim (+20 XP)</H3>
            <P>Visit your dashboard and click the daily claim button. That is all. It takes ten seconds and adds 20 XP to your total. Do this every day to keep your streak alive.</P>

            <H3>Daily Web3 quiz (+50 XP)</H3>
            <P>A new question about blockchain, Web3, or the BCL ecosystem appears each day. Answer it to earn 50 XP. It is a quick way to reinforce what you are learning and stay up to date with the space.</P>

            <Callout type="tip">Set a phone reminder for the same time each day. Two minutes per day adds up to more than 25,000 XP in a year — just from daily activities alone.</Callout>
          </>
        ),
      },
    ],
  },

  // ── Guilds & Learning ─────────────────────────────────────────────────────────
  {
    id: "guilds-learning",
    label: "Guilds & Learning",
    icon: GraduationCap,
    color: "text-blue-500",
    sections: [
      {
        id: "guilds",
        title: "Guilds",
        content: (
          <>
            <P>Guilds are the different groups within BCL Onchain, organized by interest and role. When you join, you choose the guild that best matches what you want to do in the community.</P>

            <CardGrid cards={[
              { emoji: "⚙️", title: "Developer Guild", desc: "Build DApps, deploy smart contracts, work on security challenges, and contribute to ecosystem projects." },
              { emoji: "🎨", title: "Creator Guild", desc: "Produce educational content, design materials, record tutorials, write articles, and help tell the BCL story." },
              { emoji: "🤝", title: "Community Guild", desc: "Support onboarding, organize events, manage social media, and keep the community active and welcoming." },
              { emoji: "🔬", title: "Research & ZK Track", desc: "Explore advanced blockchain topics including zero-knowledge proofs, DeFi, DAOs, and ecosystem research." },
            ]} />

            <P>Your guild is shown on your profile and helps other members understand what you focus on. You are not permanently locked into one guild — your interests can evolve as you grow in the community.</P>
          </>
        ),
      },
      {
        id: "learning-academy",
        title: "BCL Learning Academy",
        content: (
          <>
            <P>The Learning Academy is BCL's organized collection of educational tracks. It turns blockchain education from a list of links into a structured journey with real milestones.</P>

            <H3>Available learning tracks</H3>
            <Table
              headers={["Track", "Who it's for"]}
              rows={[
                ["Blockchain Fundamentals", "Complete beginners — understand how blockchains work without writing any code."],
                ["Smart Contract Development", "Learn Solidity and deploy your first contract on a test network."],
                ["DApp Development", "Build decentralized applications with a frontend connected to the blockchain."],
                ["Smart Contract Security", "Learn to identify and fix vulnerabilities in contracts."],
                ["Zero-Knowledge Technologies", "Explore ZK proofs and privacy-preserving applications."],
                ["DeFi and DAOs", "Understand decentralized finance and governance systems."],
                ["Web3 Content Creation", "Create educational content about blockchain for different audiences."],
              ]}
            />

            <H3>How learning connects to quests</H3>
            <P>Learning tracks are connected to the quest system. When you complete a module or exercise, a corresponding quest is available for you to submit proof and earn XP. This means your learning directly contributes to your community record.</P>

            <Callout type="success">
              Example path: Study Solidity basics → Build a simple contract → Submit your GitHub repo as quest proof → Earn XP → Level up → Receive a Developer milestone badge.
            </Callout>
          </>
        ),
      },
    ],
  },

  // ── .bcl Domains ─────────────────────────────────────────────────────────────
  {
    id: "domains",
    label: ".bcl Names",
    icon: Globe,
    color: "text-green-500",
    sections: [
      {
        id: "what-is-bcl-name",
        title: "What is a .bcl name?",
        content: (
          <>
            <P>A .bcl name is your community identity on the blockchain. Instead of sharing a long wallet address like <code className="font-mono text-[11px] bg-ink/[0.06] px-1.5 py-0.5 rounded">0xaB3...f9c</code>, you can use something like <strong>yourname.bcl</strong>.</P>
            <P>When you register a .bcl name, it is stored on the blockchain as an NFT in your wallet. It belongs to you for as long as you keep it renewed, and no one else in the BCL community can use the same name.</P>

            <CardGrid cards={[
              { emoji: "🪪", title: "It's your identity", desc: "Your .bcl name appears on your profile, in the leaderboard, and whenever others find you on the platform." },
              { emoji: "🔒", title: "You own it", desc: "The name is recorded on the blockchain and stored in your wallet. BCL cannot take it from you." },
              { emoji: "✏️", title: "Add your info", desc: "Attach your GitHub, Twitter, and other links to your name so anyone can learn about you in one place." },
              { emoji: "📤", title: "Share it", desc: "Your profile link becomes bcl.com/p/yourname — easy to share with anyone." },
            ]} />

            <Callout type="info">A .bcl name works within the BCL platform. It is a community name, not a general internet domain — it does not replace a website address.</Callout>
          </>
        ),
      },
      {
        id: "getting-a-name",
        title: "Getting your .bcl name",
        content: (
          <>
            <P>Go to the <strong>Domains</strong> page, search for the name you want, and follow the steps below.</P>

            <StepList steps={[
              {
                title: "Search for your name",
                desc: "Type the name you want in the search box (without .bcl — just the name part). The platform checks if it is available.",
              },
              {
                title: "Choose your registration period",
                desc: "Select how many years you want to register the name for. You can choose between 1 and 10 years. You can always renew before it expires.",
              },
              {
                title: "Check the cost",
                desc: "Names cost BCL tokens to register — 10 BCL tokens per year. If you do not have BCL tokens yet, earn them through quests or visit the Rewards section.",
              },
              {
                title: "Approve and confirm",
                desc: "Your wallet will ask you to approve the token spend. This is a security step that lets the platform collect the registration fee from your wallet. Approve it, then the platform registers the name on your behalf.",
              },
              {
                title: "Your name is live",
                desc: "After a moment, your .bcl name appears in 'Your Registered Names' on the Domains page. Your profile link is now yourname.bcl.",
              },
            ]} />

            <Callout type="warn">You must have a profile username set before you can register a .bcl name. Set your username first on the Profile page.</Callout>
          </>
        ),
      },
      {
        id: "managing-your-name",
        title: "Managing your name",
        content: (
          <>
            <P>Once you have a .bcl name, you can manage it from the Domains page.</P>

            <H3>Renewing</H3>
            <P>Your name has an expiry date. If you let it expire, it goes through a short grace period where only you can renew it. After that, anyone can register it. Renew before it expires to keep your name.</P>

            <H3>Adding your information</H3>
            <P>You can attach information to your .bcl name — your Twitter handle, GitHub username, IPFS links, or any text you want. This is called resolver data. Other members or apps in the BCL ecosystem can look up your name and find this information.</P>

            <H3>Transferring</H3>
            <P>If you want to give your .bcl name to another wallet, you can transfer it. Think carefully before doing this — transfers are permanent. The new wallet owner gains full control of the name.</P>

            <Callout type="warn">Domain transfers cannot be undone. Always double-check the wallet address you are transferring to.</Callout>
          </>
        ),
      },
    ],
  },

  // ── Achievements ─────────────────────────────────────────────────────────────
  {
    id: "achievements",
    label: "Achievements",
    icon: Award,
    color: "text-pink-500",
    sections: [
      {
        id: "badges-explained",
        title: "Achievement badges",
        content: (
          <>
            <P>Achievement badges are digital certificates recorded on the blockchain. When you reach a milestone in BCL Onchain — a new level, a streak, or a significant quest — the platform mints a badge and sends it to your wallet.</P>
            <P>Because badges are stored on the blockchain, they are permanent and verifiable. Anyone can check that the badge in your wallet is genuine and was issued by BCL Onchain.</P>

            <H3>Types of badges</H3>
            <Table
              headers={["Badge type", "How you earn it"]}
              rows={[
                ["Level milestone", "Reach a new level. One badge per level reached."],
                ["Streak milestone", "Maintain a 7-day or 30-day consecutive activity streak."],
                ["Quest milestone", "Complete a significant number of verified quests."],
              ]}
            />

            <H3>Are badges transferable?</H3>
            <P>No. BCL achievement badges are <strong>soulbound</strong> — they are permanently tied to the wallet that earned them and cannot be sent to anyone else. This is intentional. A badge proves that <em>you</em> did the work.</P>

            <Callout type="success">Your badges are yours forever. They remain in your wallet even if BCL Onchain changes or shuts down, because they live on the blockchain.</Callout>
          </>
        ),
      },
      {
        id: "badge-status",
        title: "Badge minting status",
        content: (
          <>
            <P>When you earn a badge, the platform processes it in the background. You can see the current status in your Profile under <strong>Badges & Achievements</strong>.</P>

            <Table
              headers={["Status", "What it means"]}
              rows={[
                ["Queued", "You have earned the badge. The platform is preparing to issue it."],
                ["Pending", "The badge transaction has been sent to the blockchain and is being confirmed."],
                ["Confirmed ✅", "The badge is in your wallet. You can view it on your profile."],
                ["Failed", "Something went wrong. The platform will retry automatically."],
              ]}
            />

            <Callout type="info">Badge minting can take a few minutes because blockchain transactions need time to be confirmed. If your badge shows Pending, wait a little while and check again.</Callout>
          </>
        ),
      },
    ],
  },

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  {
    id: "leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    color: "text-yellow-500",
    sections: [
      {
        id: "leaderboard-explained",
        title: "The leaderboard",
        content: (
          <>
            <P>The leaderboard ranks all BCL Onchain members by total XP. It is updated in real time as quests are completed and daily bonuses are claimed.</P>
            <P>The leaderboard is public — anyone can view it without connecting a wallet. You can search for a member by their username or wallet address.</P>

            <H3>Why the leaderboard matters</H3>
            <UL items={[
              "It shows who is contributing consistently to the community.",
              "BCL can use it to recognize top contributors at events, in communications, and for opportunities.",
              "It creates healthy competition that encourages members to stay active and improve their skills.",
            ]} />

            <Callout type="warn">Leaderboard position does not automatically determine who receives grants, mentorship, or hardware. Those decisions involve human review and consider the quality of your contributions, not just the quantity.</Callout>

            <H3>How to climb the leaderboard</H3>
            <UL items={[
              "Complete higher-value quests — developer and project quests award the most XP.",
              "Keep your daily streak going — consistent daily activity adds up quickly.",
              "Participate in events and hackathons — these often have bonus XP opportunities.",
              "Quality over quantity — verified submissions count; rejected ones do not.",
            ]} />
          </>
        ),
      },
    ],
  },

  // ── Rewards & Market ─────────────────────────────────────────────────────────
  {
    id: "rewards",
    label: "Rewards",
    icon: Gift,
    color: "text-emerald-500",
    sections: [
      {
        id: "rewards-explained",
        title: "Rewards",
        content: (
          <>
            <P>The Rewards section is where your XP and contributions translate into real benefits. As you reach milestones and maintain activity, you become eligible for different types of rewards.</P>

            <Table
              headers={["Reward type", "What it is"]}
              rows={[
                ["Achievement NFTs", "Blockchain badges minted to your wallet when you reach level milestones."],
                ["BCL tokens", "Tokens distributed through quest completions and ecosystem activities — used for domain registration."],
                ["Mentorship sessions", "Access to guidance from senior community members and industry contacts."],
                ["Event passes", "Priority access or free entry to BCL workshops, hackathons, and partner events."],
                ["Hardware wallets", "Physical security devices for members who reach high contribution levels."],
                ["Career opportunities", "BCL can highlight active contributors when ecosystem partners post developer opportunities."],
              ]}
            />

            <Callout type="info">Rewards that involve physical items or third-party benefits depend on what BCL has available at any given time. Check the Rewards page for what is currently active.</Callout>
          </>
        ),
      },
      {
        id: "marketplace",
        title: "Marketplace",
        content: (
          <>
            <P>The Marketplace is a space where members can buy and sell BCL ecosystem assets — including .bcl domain names that members choose to list.</P>
            <UL items={[
              "List a .bcl domain you own for other members to purchase.",
              "Browse available names if the one you want is already taken but listed for sale.",
              "Purchase using BCL tokens.",
            ]} />
            <Callout type="warn">Achievement badges are soulbound and cannot be listed or traded on the marketplace. Only transferable assets like .bcl domain NFTs can be bought and sold.</Callout>
          </>
        ),
      },
    ],
  },

  // ── Events ───────────────────────────────────────────────────────────────────
  {
    id: "events",
    label: "Events",
    icon: Star,
    color: "text-orange-500",
    sections: [
      {
        id: "events-explained",
        title: "Events",
        content: (
          <>
            <P>The Events page lists BCL's upcoming community activities — from technical workshops to community hangouts and hackathons.</P>

            <H3>Types of events</H3>
            <CardGrid cards={[
              { emoji: "🛠️", title: "Technical workshops", desc: "Hands-on sessions covering tools and skills — Foundry masterclasses, Solidity workshops, security exercises." },
              { emoji: "🏆", title: "Hackathons", desc: "The Confluence Hackathon and other competitive events where teams build and present projects." },
              { emoji: "🎙️", title: "Community sessions", desc: "X Spaces discussions, town halls, member showcases, and open conversations about the blockchain space." },
              { emoji: "🎓", title: "Onboarding sessions", desc: "Regular sessions for new members to learn about BCL, set up their wallets, and get started on the platform." },
            ]} />

            <H3>Connecting events to quests</H3>
            <P>Many events have corresponding quests. For example, attending a Foundry workshop might have a follow-up quest where you submit a project you built during or after the session. This connects physical participation to your permanent community record.</P>

            <H3>RSVP and reminders</H3>
            <P>You can RSVP to upcoming events directly from the Events page. Setting a reminder sends you a notification when the event is about to start.</P>
          </>
        ),
      },
    ],
  },

  // ── Notifications ─────────────────────────────────────────────────────────────
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    color: "text-ink-3",
    sections: [
      {
        id: "notifications-explained",
        title: "Notifications",
        content: (
          <>
            <P>BCL Onchain keeps you informed about activity related to your account. Notifications appear in the bell icon in the top navigation bar.</P>

            <Table
              headers={["Notification", "When you get it"]}
              rows={[
                ["Quest verified ✅", "Your submission was approved and XP has been added."],
                ["Quest rejected", "Your submission was not accepted. Check the reason and resubmit if allowed."],
                ["XP awarded", "Points were added to your account."],
                ["Level up 🎉", "You have reached a new level."],
                ["Badge minted", "Your achievement badge has been confirmed on the blockchain."],
                ["Streak bonus", "Your daily streak claim was recorded."],
                ["Domain registered", "Your .bcl name registration was successful."],
                ["Domain expiring", "Your .bcl name is approaching its expiry date — time to renew."],
              ]}
            />

            <Callout type="tip">Check your notifications after submitting a quest. Verified submissions are usually processed within a short time, though some manual reviews take longer.</Callout>
          </>
        ),
      },
    ],
  },

  // ── FAQ ──────────────────────────────────────────────────────────────────────
  {
    id: "faq",
    label: "FAQ",
    icon: HelpCircle,
    color: "text-ink-3",
    sections: [
      {
        id: "faq-general",
        title: "Common questions",
        content: (
          <>
            <H3>Do I need any money to join?</H3>
            <P>No. Creating an account, completing quests, earning XP, and using most features are free. You only need BCL tokens if you want to register a .bcl domain name, and those tokens can be earned through quests.</P>

            <H3>Do I need to know blockchain development to use the platform?</H3>
            <P>Not at all. There are quests for all skill levels — from complete beginners to experienced developers. Start with community and learning quests, and grow from there.</P>

            <H3>What happens to my account if I change wallets?</H3>
            <P>Your account is tied to your wallet address. If you use a different wallet, you would be starting a new account. Keep your original wallet safe and do not share your recovery phrase with anyone.</P>

            <H3>Why was my quest submission rejected?</H3>
            <P>The most common reasons are: the evidence did not clearly show the completed work, the submission did not match the quest requirements, or the link or transaction provided could not be verified. Check the rejection reason on your profile, improve your evidence, and resubmit if the quest allows it.</P>

            <H3>How long does quest verification take?</H3>
            <P>Automatic on-chain verification usually happens within minutes. Manual review by a BCL admin can take longer depending on the queue. You will receive a notification when your submission is processed.</P>

            <H3>Can I earn XP for things I did before joining?</H3>
            <P>No. XP is only awarded for activities submitted and verified through the platform after you create your account.</P>

            <H3>What if I lose access to my wallet?</H3>
            <P>Your wallet recovery phrase is the only way to restore access. BCL cannot recover your account if you lose your wallet. Store your recovery phrase somewhere safe and offline.</P>

            <H3>Why am I being asked to sign a message when I log in?</H3>
            <P>Signing the message proves that you control the wallet you are connecting with. It is a security step, not a payment. Your wallet will show you the message text — it will mention BCL Onchain. If you see anything unexpected, do not sign it and contact the club.</P>

            <H3>My .bcl name is not showing on my profile</H3>
            <P>After registration, it can take a short time for the blockchain transaction to confirm and for your profile to update. Wait a few minutes and refresh the page. If it still does not appear, check the Domains page for the registration status.</P>

            <H3>How do I contact BCL if I have a problem?</H3>
            <P>Reach out through the club's official channels — WhatsApp community, X (Twitter), or directly to a club officer. Do not share your wallet details or recovery phrase with anyone claiming to represent BCL.</P>
          </>
        ),
      },
    ],
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeCategory, setActiveCategory] = useState("welcome");
  const [activeSection,  setActiveSection]  = useState("what-is-bcl");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const category = DOCS.find(c => c.id === activeCategory) ?? DOCS[0];
  const section  = category.sections.find(s => s.id === activeSection) ?? category.sections[0];

  const searchResults = searchQuery.trim().length > 1
    ? DOCS.flatMap(cat =>
        cat.sections
          .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(s => ({ cat, section: s }))
      )
    : [];

  function navigate(catId: string, secId: string) {
    setActiveCategory(catId);
    setActiveSection(secId);
    setSearchQuery("");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    const cat = DOCS.find(c => c.id === activeCategory);
    if (cat && !cat.sections.find(s => s.id === activeSection)) {
      setActiveSection(cat.sections[0].id);
    }
  }, [activeCategory]);

  const allSections = DOCS.flatMap(c => c.sections.map(s => ({ cat: c, section: s })));
  const currentIdx  = allSections.findIndex(x => x.section.id === activeSection);
  const prev        = allSections[currentIdx - 1];
  const next        = allSections[currentIdx + 1];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/[0.08] pb-6 mb-6">
        <div>
          <div className="text-xs font-semibold text-accent-fg uppercase tracking-wider font-mono mb-1">BCL Onchain</div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink tracking-tight">Community Guide</h1>
          <p className="text-sm text-ink-4 mt-1">Everything you need to get started and make the most of BCL Onchain.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search the guide…"
            className="w-full bg-surface border border-ink/[0.1] rounded-xl pl-9 pr-9 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-accent/50 transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-ink-4 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-surface border border-ink/[0.1] rounded-xl shadow-xl overflow-hidden">
              {searchResults.map(({ cat, section: sec }) => (
                <button key={sec.id} onClick={() => navigate(cat.id, sec.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-ink/[0.04] transition-colors border-b border-ink/[0.04] last:border-0">
                  <div className="text-xs font-bold text-ink">{sec.title}</div>
                  <div className="text-[10px] text-ink-4 font-mono mt-0.5 uppercase">{cat.label}</div>
                </button>
              ))}
            </div>
          )}
          {searchQuery.trim().length > 1 && searchResults.length === 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-surface border border-ink/[0.1] rounded-xl shadow-xl px-4 py-3 text-sm text-ink-4">
              No results for "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 relative">

        {/* Mobile fab */}
        <button onClick={() => setSidebarOpen(o => !o)}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-accent text-surface shadow-lg flex items-center justify-center">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-60 shrink-0
          bg-surface lg:bg-transparent border-r border-ink/[0.08] lg:border-0
          transform transition-transform duration-200 overflow-y-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          pt-16 lg:pt-0 px-4 lg:px-0
        `}>
          <nav className="space-y-0.5 sticky top-4">
            {DOCS.map(cat => {
              const Icon = cat.icon;
              const isActive = cat.id === activeCategory;
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => { setActiveCategory(cat.id); setActiveSection(cat.sections[0].id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive ? "bg-accent/[0.08] text-ink" : "text-ink-4 hover:text-ink hover:bg-ink/[0.04]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? cat.color : ""}`} />
                    <span className="flex-1 text-left">{cat.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isActive ? "rotate-0" : "-rotate-90"}`} />
                  </button>
                  {isActive && (
                    <div className="ml-3.5 mt-0.5 mb-1 space-y-0.5 border-l border-ink/[0.06] pl-3">
                      {cat.sections.map(sec => (
                        <button key={sec.id} onClick={() => navigate(cat.id, sec.id)}
                          className={`w-full text-left text-[11px] py-1 px-2 rounded-lg transition-colors ${
                            sec.id === activeSection ? "text-accent-fg font-bold" : "text-ink-4 hover:text-ink"
                          }`}>
                          {sec.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main ref={contentRef} className="flex-1 min-w-0">

          {/* Mobile pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden no-scrollbar">
            {DOCS.map(cat => {
              const Icon = cat.icon;
              return (
                <button key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setActiveSection(cat.sections[0].id); }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    cat.id === activeCategory ? "bg-accent/10 text-accent-fg border border-accent/20" : "bg-ink/5 text-ink-4"
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {cat.label}
                </button>
              );
            })}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-ink-4 uppercase tracking-wider mb-5">
            <span>Guide</span>
            <ChevronRight className="w-3 h-3" />
            <span className={category.color}>{category.label}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink">{section.title}</span>
          </div>

          {/* Article */}
          <article className="surface-card rounded-2xl p-6 sm:p-8">
            <h1 className="text-2xl font-heading font-bold text-ink mb-1">{section.title}</h1>
            <div className="h-0.5 w-12 bg-accent/60 rounded-full mb-6" />
            <div>{section.content}</div>

            {/* Prev / Next */}
            <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-ink/[0.06]">
              {prev ? (
                <button onClick={() => navigate(prev.cat.id, prev.section.id)}
                  className="flex items-center gap-2 text-xs font-bold text-ink-4 hover:text-ink transition-colors group">
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  <div className="text-left">
                    <div className="text-[10px] text-ink-5 uppercase tracking-wider">Previous</div>
                    <div>{prev.section.title}</div>
                  </div>
                </button>
              ) : <div />}
              {next ? (
                <button onClick={() => navigate(next.cat.id, next.section.id)}
                  className="flex items-center gap-2 text-xs font-bold text-ink-4 hover:text-ink transition-colors group text-right">
                  <div>
                    <div className="text-[10px] text-ink-5 uppercase tracking-wider">Next</div>
                    <div>{next.section.title}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : <div />}
            </div>
          </article>
        </main>

        {/* Right ToC */}
        <aside className="hidden xl:block w-44 shrink-0">
          <div className="sticky top-4">
            <div className="text-[10px] font-mono font-bold text-ink-4 uppercase tracking-wider mb-3">On this page</div>
            <nav className="space-y-0.5">
              {category.sections.map(sec => (
                <button key={sec.id} onClick={() => navigate(activeCategory, sec.id)}
                  className={`w-full text-left text-[11px] py-1 px-2 rounded-lg transition-colors ${
                    sec.id === activeSection ? "text-accent-fg font-bold" : "text-ink-4 hover:text-ink"
                  }`}>
                  {sec.title}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-ink/[0.06] space-y-1">
              <div className="text-[10px] font-mono font-bold text-ink-4 uppercase tracking-wider mb-2">Jump to</div>
              <Link href="/tasks" className="flex items-center gap-1.5 text-[11px] text-ink-4 hover:text-ink transition-colors py-0.5">
                <Compass className="w-3 h-3" /> Browse Quests
              </Link>
              <Link href="/domains" className="flex items-center gap-1.5 text-[11px] text-ink-4 hover:text-ink transition-colors py-0.5">
                <Globe className="w-3 h-3" /> Get .bcl Name
              </Link>
              <Link href="/learn" className="flex items-center gap-1.5 text-[11px] text-ink-4 hover:text-ink transition-colors py-0.5">
                <GraduationCap className="w-3 h-3" /> Learning Tracks
              </Link>
              <Link href="/leaderboard" className="flex items-center gap-1.5 text-[11px] text-ink-4 hover:text-ink transition-colors py-0.5">
                <Trophy className="w-3 h-3" /> Leaderboard
              </Link>
              <Link href="/events" className="flex items-center gap-1.5 text-[11px] text-ink-4 hover:text-ink transition-colors py-0.5">
                <Star className="w-3 h-3" /> Events
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}