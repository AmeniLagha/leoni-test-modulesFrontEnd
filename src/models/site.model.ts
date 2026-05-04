
// site.model.ts
export interface Site {
  id: number;
  name: string;
  description: string;
  active: boolean;
projets?: Projet[];
projetIds?: number[];      // ✅ Ajouter
  projetNames?: string[];

}
export interface Projet {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

