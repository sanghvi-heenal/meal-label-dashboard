export type DietValue =
  | "vegetarian"
  | "vegan"
  | "nonVeg"
  | "eggetarian"
  | "pescatarian"
  | "jain"
  | "keto"
  | "none";

export const DIET_VALUES: DietValue[] = [
  "vegetarian",
  "vegan",
  "nonVeg",
  "eggetarian",
  "pescatarian",
  "jain",
  "keto",
  "none",
];

/** Canonical stored labels for `profile.dietType`. */
export const DIET_LABEL: Record<DietValue, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  nonVeg: "Non-vegetarian",
  eggetarian: "Eggetarian",
  pescatarian: "Pescatarian",
  jain: "Jain",
  keto: "Keto",
  none: "Balanced",
};

/** Map a stored `dietType` string back to its canonical key. Falls back to "none". */
export const dietValueFromStored = (stored: string): DietValue => {
  const match = (Object.keys(DIET_LABEL) as DietValue[]).find(
    (k) => DIET_LABEL[k] === stored,
  );
  return match ?? "none";
};