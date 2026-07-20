import next from "eslint-config-next";

/** Flat config nativo de eslint-config-next (Next 16 / ESLint 9). */
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
