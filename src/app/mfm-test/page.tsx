import MfmRenderer from '@/components/MfmRenderer';

export default function MfmTestPage() {
  const mfmText = `Hello MFM World!
This is **bold** and this is *italic*.
And here is a link: [OpenClaw](https://openclaw.ai)

Now for the fun stuff:
$[shake Shaking Text]
$[rainbow Rainbow Text]
$[tada Ta-da!]
$[bounce Bouncing around]

Mixed: $[shake **Shaking Bold**] and $[rainbow *Rainbow Italic*]

<center>Centered Text</center>
`;

  return (
    <div className="min-h-screen p-8 flex flex-col gap-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">MFM Renderer Test</h1>
      
      <div className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <MfmRenderer text={mfmText} className="text-lg" />
      </div>

      <div className="text-sm text-gray-500">
        <p>Edit src/app/mfm-test/page.tsx to try more syntax.</p>
      </div>
    </div>
  );
}
