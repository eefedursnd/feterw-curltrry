export interface Domain {
    id: string;
    name: string;
    only_premium: boolean;
    max_usage: number;
    current_usage: number;
    expires_at: string;
    created_at: string;
    updated_at: string;
}

export interface DomainAssignment {
    id: number;
    uid: number;
    domain_id: string;
    assigned_at: string;
    created_at: string;
    updated_at: string;
}

export interface DomainWithDetails {
    assignment: DomainAssignment;
    domain: Domain;
    is_expiring: boolean;
}

export interface AssignDomainRequest {
    domain_id: string;
}

export interface RenewDomainRequest {
    duration_days: number;
}

export interface DomainSelectionCheckResult {
    has_selected: boolean;
}