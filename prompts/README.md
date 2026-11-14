# Research prompts

`meta.txt` discovers five or fewer actual news developments and discloses access
and attention evidence. `gemini.txt` independently checks individual claims and
prepares publishable facts plus hook-safe premises. `claude.txt` selects a story,
compares three strong hook options, and writes a 45–50-second Tanglish reel.

The memorable NVIDIA opening is a reference for familiarity, rhythm and contrast.
It is not a universal catchphrase or evidence for the underlying story. The hook
must connect to verified facts by the next sentence and pay off in the reel.

The dashboard serves these canonical files and appends a dated, region-labelled
research packet. No Meta, Gemini or Claude API is called automatically. Copy the
packet into your chosen service, inspect its output, then bring the dossier back.
The Meta prompt's final JSON block creates comparison cards; plain text reports
are also retained and included in verification handoffs.

Synchronise edited canonical prompts to another folder with:

```powershell
node scripts/sync-prompts.cjs "C:/Users/binu/OneDrive/Documents"
```

That script backs up all three destination files before replacing any of them.
It does not send their contents to a model or another service.
