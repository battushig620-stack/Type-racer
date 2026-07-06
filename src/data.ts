export interface TypingText {
  id: string;
  title: string;
  text: string;
  category: 'literature' | 'code' | 'quotes' | 'tech';
  difficulty: 'easy' | 'medium' | 'hard';
}

export const TYPING_TEXTS: TypingText[] = [
  {
    id: 'lit-1',
    title: 'The Great Gatsby',
    text: 'So we beat on, boats against the current, borne back ceaselessly into the past.',
    category: 'literature',
    difficulty: 'easy'
  },
  {
    id: 'lit-2',
    title: 'Pride and Prejudice',
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    category: 'literature',
    difficulty: 'easy'
  },
  {
    id: 'tech-1',
    title: 'The Essence of Code',
    text: 'Computer science is no more about computers than astronomy is about telescopes. The best code is no code at all, and the second best code is simple code that is easy to understand and maintain.',
    category: 'tech',
    difficulty: 'medium'
  },
  {
    id: 'quote-1',
    title: 'Silicon Valley Philosophy',
    text: 'Move fast and break things. Unless you are breaking stuff, you are not moving fast enough. The biggest risk is not taking any risk in a world that is changing really quickly.',
    category: 'quotes',
    difficulty: 'medium'
  },
  {
    id: 'code-1',
    title: 'React Component Snippet',
    text: 'const [state, setState] = useState(initialState); useEffect(() => { console.log("Component mounted successfully"); return () => clearInterval(timer); }, []);',
    category: 'code',
    difficulty: 'hard'
  },
  {
    id: 'code-2',
    title: 'TypeScript Interface',
    text: 'interface User<T> { id: string; email: string; permissions: T[]; isActive: boolean; lastLogin: Date; }',
    category: 'code',
    difficulty: 'hard'
  },
  {
    id: 'tech-2',
    title: 'Artificial Intelligence',
    text: 'The search for artificial intelligence is the ultimate pursuit of understanding the human mind. By building systems that think, learn, and adapt, we hold a mirror up to our own cognitive capabilities.',
    category: 'tech',
    difficulty: 'medium'
  },
  {
    id: 'quote-2',
    title: 'Winston Churchill',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts. Continuous effort, not strength or intelligence, is the key to unlocking our potential.',
    category: 'quotes',
    difficulty: 'medium'
  },
  {
    id: 'quote-3',
    title: 'Alan Turing',
    text: 'We can only see a short distance ahead, but we can see plenty there that needs to be done. Sometimes it is the people no one can imagine anything of who do the things no one can imagine.',
    category: 'quotes',
    difficulty: 'medium'
  },
  {
    id: 'easy-1',
    title: 'Short Quick Race',
    text: 'The quick brown fox jumps over the lazy dog.',
    category: 'quotes',
    difficulty: 'easy'
  },
  {
    id: 'code-3',
    title: 'HTML Boilerplate',
    text: '<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <title>Document</title> </head> <body> <div id="root"></div> </body> </html>',
    category: 'code',
    difficulty: 'hard'
  }
];

export function getRandomText(difficulty?: 'easy' | 'medium' | 'hard'): TypingText {
  let list = TYPING_TEXTS;
  if (difficulty) {
    list = TYPING_TEXTS.filter(t => t.difficulty === difficulty);
  }
  return list[Math.floor(Math.random() * list.length)];
}
