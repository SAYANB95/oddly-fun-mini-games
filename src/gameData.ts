export type GameMode = 'pop' | 'odd' | 'sort';

export type GameCard = {
  id: GameMode;
  title: string;
  tag: string;
  subtitle: string;
  emoji: string;
  background: string;
  accent: string;
};

export const GAME_CARDS: GameCard[] = [
  {
    id: 'pop',
    title: 'Pop Rush',
    tag: 'SATISFYING',
    subtitle: 'Pop the whole board before your tiny clock panics.',
    emoji: '🫧',
    background: '#CFEFFF',
    accent: '#50B8FF',
  },
  {
    id: 'odd',
    title: 'Odd One',
    tag: 'EAGLE EYES',
    subtitle: 'One emoji is lying. Find it faster every round.',
    emoji: '🧐',
    background: '#E8D8FF',
    accent: '#9B71F2',
  },
  {
    id: 'sort',
    title: 'Color Drop',
    tag: 'QUICK SORT',
    subtitle: 'Route the falling color into the matching bin.',
    emoji: '🎨',
    background: '#DDF5D7',
    accent: '#64C86A',
  },
];

export const COLORS = ['#5BC0EB', '#FF6B6B', '#FFD166', '#8B6DFF', '#5ED69A'];
export const SORT_COLORS = ['#FF5D5D', '#4DA7FF', '#FFD052', '#67CE77'];
