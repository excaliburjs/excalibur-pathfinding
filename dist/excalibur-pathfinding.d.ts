import { Loadable, TileMap } from "excalibur";
export type GraphNode = {
    id: number | string;
    value?: any;
};
export type aStarNode = {
    id: number | string;
    collider: boolean;
    gCost: number;
    hCost: number;
    fCost: number;
    x: number;
    y: number;
    checked: boolean;
    parent: aStarNode | null;
};
export type Edge = {
    name: string;
    from: GraphNode;
    to: GraphNode;
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
    duration: number;
    starttime: number;
    endtime: number;
    isLoaded(): boolean;
    load(): Promise<any>;
    key: boolean;
    nodes: Map<string, GraphNode>;
    edges: Map<string, Edge>;
    addNode(node: GraphNode): void;
    addEdge(edge: Edge, bidirectional?: boolean): void;
    resetGraph(): void;
    addTileMap(tilemap: GraphTileMap, diagonal?: boolean): void;
    getNodes(): Map<string, GraphNode>;
    getEdges(): Map<string, Edge>;
    getAdjacentNodes(node: GraphNode): GraphNode[];
    getAdjacentEdges(node: GraphNode): Edge[];
    getAdjacentEdgesTo(node: GraphNode): Edge[];
    bfs(startnode: GraphNode, endnode: GraphNode): boolean;
    dfs(startnode: GraphNode, endnode: GraphNode, visited?: Set<unknown>): boolean;
    dijkstra(sourcenode: GraphNode): Array<{
        node: GraphNode;
        distance: number;
        previous: GraphNode | null;
    }>;
    shortestPath(startnode: GraphNode, endnode: GraphNode): GraphNode[];
}
export declare class ExcaliburAstar {
    tilemap: {
        cols: number;
        rows: number;
    };
    grid: aStarNode[];
    currentNode: aStarNode | null;
    currentIndex: number;
    checkedNodes: aStarNode[];
    openNodes: aStarNode[];
    startnode: aStarNode | null;
    endnode: aStarNode | null;
    goalReached: boolean;
    path: aStarNode[];
    duration: number;
    starttime: number;
    endtime: number;
    constructor(tilemap: TileMap | GraphTileMap);
    setCost(): void;
    astar(sourcenode: aStarNode, endnode: aStarNode, diagonal?: boolean): aStarNode[];
    getNeighbors(node: aStarNode, diagonal: boolean): aStarNode[];
    getNodeByIndex(index: number): aStarNode;
    getNodeByCoord(x: number, y: number): aStarNode;
    getGcost(node: aStarNode, startnode: aStarNode): number;
    getHcost(node: aStarNode, endnode: aStarNode): number;
    getFcost(node: aStarNode): number;
    resetGrid(): void;
}
//# sourceMappingURL=excalibur-pathfinding.d.ts.map