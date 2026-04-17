export const AVATARS = [
  ...Array.from({ length: 151 }).map((_, i) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${i + 1}.png`),
  ...Array.from({ length: 50 }).map((_, i) => `https://rickandmortyapi.com/api/character/avatar/${i + 1}.jpeg`),
];
