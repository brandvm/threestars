// The pinned Finsweet distribution does not ship TypeScript declarations.
declare module "@finsweet/attributes/dist/src-T7SM3ONB.js" {
  export interface ListItem { element: HTMLElement }
  export interface List {
    instance: string | null;
    wrapperElement: HTMLElement;
    items: { value: ListItem[] };
    loadingPaginatedItems?: Promise<void>;
    addHook(key: "afterRender", callback: (items: ListItem[]) => void): void;
  }
  export function init(): Promise<{ result: List[]; destroy(): void }>;
}
