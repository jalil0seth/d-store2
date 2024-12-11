declare function route(name: string, params?: Record<string, any>): string;

interface Window {
    route: typeof route;
}
