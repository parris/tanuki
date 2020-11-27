import { CodeTemplate as CodeTemplate } from "./CodeTemplate";
export declare type WorkflowStep = {
    template: string;
    input: object | null;
    connections: {
        [key: string]: number;
    } | null;
    pos: {
        x: number;
        y: number;
    } | null;
};
export declare type Workflow = {
    steps: Array<WorkflowStep>;
    resultStep: number;
};
export declare function run(workflow: Workflow, templates: Record<string, CodeTemplate>): any;
//# sourceMappingURL=Workflow.d.ts.map