import { Loadable } from "excalibur";
type Node = {
    name: string;
    value?: any;
};
type Edge = {
    name: string;
    from: Node;
    to: Node;
    value?: number;
};
export type GraphTile = {
    name?: string;
    index?: number;
    coordinates?: {
        x: number;
        y: number;
    };
    data?: any;
    collider?: boolean;
};
export type GraphTileMap = {
    name: string;
    tiles: Array<GraphTile>;
    rows: number;
    cols: number;
};
export declare class ExcaliburGraph implements Loadable<any> {
    data: any;
    isLoaded(): boolean;
    load(): Promise<any>;
    key: boolean;
    nodes: Map<string, Node>;
    edges: Map<string, Edge>;
    addNode(node: Node): void;
    addEdge(edge: Edge, bidirectional?: boolean): void;
    resetGraph(): void;
    addTileMap(tilemap: GraphTileMap): void;
    getNodes(): Map<string, Node>;
    getEdges(): Map<string, Edge>;
    getAdjacentNodes(node: Node): Node[];
    getAdjacentEdges(node: Node): Edge[];
    getAdjacentEdgesTo(node: Node): Edge[];
    bfs(startnode: Node, endnode: Node): boolean;
    dfs(startnode: Node, endnode: Node, visited?: Set<unknown>): boolean;
    dijkstra(sourcenode: Node): Array<{
        node: Node;
        distance: number;
        previous: Node | null;
    }>;
    shortestPath(startnode: Node, endnode: Node): Node[];
}
export {};
//# sourceMappingURL=index.d.ts.map