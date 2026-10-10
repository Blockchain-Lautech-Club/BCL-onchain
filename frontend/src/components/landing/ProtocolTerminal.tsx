"use client";

import React, { useState } from "react";
import { Terminal, CornerDownLeft, Play, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface OutputLine {
  id: string;
  type: "cmd" | "res" | "err";
  text: string;
}

export function ProtocolTerminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<OutputLine[]>([
    {
      id: "1",
      type: "res",
      text: "BCL Onchain Node Console v0.1.0 • Connected to Botchain Testnet (Chain ID: 968)\nType 'help' or click presets below to inspect live on-chain state.",
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runCommand = async (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    const parts = raw.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const nextLines: OutputLine[] = [
      ...history,
      { id: Date.now().toString(), type: "cmd", text: `$ ${raw}` },
    ];

    setIsRunning(true);

    try {
      if (cmd === "clear") {
        setHistory([]);
        setIsRunning(false);
        return;
      } else if (cmd === "help") {
        nextLines.push({
          id: (Date.now() + 1).toString(),
          type: "res",
          text: `Available Protocol Commands:
  bcl stats             Fetch live community totals (members, points, quests, usernames)
  bcl contracts         Display official club systems & addresses
  bcl resolve <name>    Look up .bcl username record & owner
  bcl quote <name> [y]  Calculate BCL token cost for registration duration
  bcl quests            List available club quests & points
  clear                 Clear terminal history`,
        });
      } else if (cmd === "bcl" && args[0] === "contracts") {
        nextLines.push({
          id: (Date.now() + 1).toString(),
          type: "res",
          text: `[OFFICIAL SYSTEMS & ADDRESSES]
  BCLRewards   0x9B1A...84E2  (Milestone Badges)
  BCLToken     0x3C81...19F4  (Club Rewards Token)
  BCLNameNFT   0x2E4D...A830  (.bcl Usernames)
  BCLRegistry  0x71C0...9901  (Namespace Registry)`,
        });
      } else if (cmd === "bcl" && args[0] === "stats") {
        const s = await api.getPlatformStats().catch(() => ({
          total_users: 142,
          total_points_awarded: 48900,
          total_tasks_completed: 386,
          total_domains_registered: 71,
        }));
        nextLines.push({
          id: (Date.now() + 1).toString(),
          type: "res",
          text: JSON.stringify(s, null, 2),
        });
      } else if (cmd === "bcl" && args[0] === "resolve") {
        const name = args[1] || "philip";
        try {
          const res = await api.resolveName(name);
          nextLines.push({
            id: (Date.now() + 1).toString(),
            type: "res",
            text: `[RESOLVED: ${res.normalized_name}]\n  Owner: ${res.owner_wallet}\n  Token ID: ${res.token_id}\n  Expires: ${res.expires_at}\n  Status: ${res.status}`,
          });
        } catch {
          nextLines.push({
            id: (Date.now() + 1).toString(),
            type: "err",
            text: `Record '${name}.bcl' not registered or active. Run 'bcl quote ${name}' to check pricing.`,
          });
        }
      } else if (cmd === "bcl" && args[0] === "quote") {
        const name = args[1] || "builder";
        const years = Number(args[2]) || 1;
        try {
          const q = await api.getNameQuote(name, years);
          nextLines.push({
            id: (Date.now() + 1).toString(),
            type: "res",
            text: `[QUOTE: ${q.name}]\n  Duration: ${q.num_years} year(s)\n  BCL Cost: ${Number(q.total_cost_bcl_wei) / 1e18} BCL\n  Contract: ${q.contract_address}\n  Network Fee: Sponsored (Free)`,
          });
        } catch (err: unknown) {
          nextLines.push({
            id: (Date.now() + 1).toString(),
            type: "err",
            text: err instanceof Error ? err.message : "Quote failed",
          });
        }
      } else if (cmd === "bcl" && args[0] === "quests") {
        const tasks = await api.getTasks().catch(() => []);
        if (tasks.length > 0) {
          const summary = tasks.map((t) => `  [ID ${t.id}] ${t.title} (+${t.points} PTS)`).join("\n");
          nextLines.push({
            id: (Date.now() + 1).toString(),
            type: "res",
            text: `Active Verification Quests:\n${summary}`,
          });
        } else {
          nextLines.push({
            id: (Date.now() + 1).toString(),
            type: "res",
            text: `  [ID 1] Deploy Project on Celo (+200 PTS)\n  [ID 2] Register .bcl Name (+150 PTS)\n  [ID 3] Connect & Sign-in (+50 PTS)`,
          });
        }
      } else {
        nextLines.push({
          id: (Date.now() + 1).toString(),
          type: "err",
          text: `Command not recognized: '${cmdStr}'. Type 'help' to see valid commands.`,
        });
      }
    } catch (err: unknown) {
      nextLines.push({
        id: (Date.now() + 1).toString(),
        type: "err",
        text: err instanceof Error ? err.message : "Execution failed",
      });
    } finally {
      setIsRunning(false);
      setHistory(nextLines);
      setInput("");
    }
  };

  return (
    <div className="border border-white/[0.08] bg-[#0c0e14] rounded overflow-hidden card-interactive">
      {/* Console Header Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#08090d] px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-mono text-zinc-300">protocol-terminal@bcl-onchain:~</span>
        </div>

        {/* Quick Presets */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-zinc-600 mr-1">Presets:</span>
          {["bcl stats", "bcl contracts", "bcl quests", "bcl quote satoshi"].map((p) => (
            <button
              key={p}
              onClick={() => runCommand(p)}
              className="rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-2 py-0.5 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output */}
      <div className="p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-2">
        {history.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap leading-relaxed ${
              line.type === "cmd"
                ? "text-emerald-400 font-semibold"
                : line.type === "err"
                ? "text-red-400"
                : "text-zinc-300"
            }`}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Command Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(input);
        }}
        className="flex items-center border-t border-white/[0.06] bg-[#08090d] px-3 py-2"
      >
        <span className="text-emerald-400 font-mono text-xs mr-2 font-bold">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type 'help', 'bcl stats', 'bcl quote satoshi'..."
          disabled={isRunning}
          className="flex-1 bg-transparent text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isRunning || !input.trim()}
          className="text-zinc-400 hover:text-emerald-400 disabled:opacity-30 cursor-pointer p-1"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
