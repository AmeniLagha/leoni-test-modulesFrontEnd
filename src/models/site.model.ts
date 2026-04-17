
// site.model.ts
export interface Site {
  id: number;
  name: string;
  description: string;
  active: boolean;
projets?: Projet[];

}
export interface Projet {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

