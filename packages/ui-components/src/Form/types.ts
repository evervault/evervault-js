import type { ThemeObject } from "types";

export interface FormConfig {
    autoFocus?: boolean;
    theme?: ThemeObject;
    formUuid: string;
    formSubmissionUrl: string;
}

export interface FormElement {
    elementName: string;
    elementType: string;
    options?: { value: string; label: string }[];
}

export interface FormApiResponse {
    id: number;
    uuid: string;
    appUuid: string;
    targetElements: FormElement[];
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}