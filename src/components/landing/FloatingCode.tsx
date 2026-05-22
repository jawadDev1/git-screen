const snippets = [
  `async function fetchRepos(user) {\n  return await octokit.rest.repos...\n}`,
  `export const useCandidateScore = (id) => {\n  const [score, setScore] = useState...\n}`,
  `class TechnicalRecruiter extends Manager {\n  constructor() { super('GitScreen'); }\n}`,
];

const rotations = [
  "-rotate-6 translate-y-12",
  "rotate-3 -translate-y-8",
  "-rotate-2 translate-y-4",
];

export const FloatingCode = () => (
  <div
    aria-hidden
    className="absolute bottom-25 left-0 w-full h-96 overflow-hidden -z-10 pointer-events-none select-none opacity-20"
  >
    <div className="flex justify-around items-end h-full">
      {snippets.map((code, i) => (
        <div
          key={i}
          className={`p-4 rounded-lg border border-border/30 bg-card/60 backdrop-blur-sm font-mono text-xs text-primary/60 transform ${rotations[i]}`}
        >
          {code.split("\n").map((line, j) => (
            <div key={j}>{line}</div>
          ))}
        </div>
      ))}
    </div>
  </div>
);
