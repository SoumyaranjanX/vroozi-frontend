export interface IPurchaseOrder {
    id: string;
    po_number: string;
    contract_id: string;
    amount: number;
    status: POStatus;
    created_at: string;
    updated_at: string;
    template_type?: string;
    created_by?: string;
    vendor_name?: string;
    vendor_address?: string;
    vendor_phone?: string;
    vendor_email?: string;
    buyer_name?: string;
    buyer_address?: string;
    buyer_phone?: string;
    buyer_email?: string;
    payment_terms?: string;
    line_items?: Array<{
        name: string;
        description: string;
        quantity: number;
        unit_price: number;
    }>;
    subtotal?: number;
    tax?: number;
    total?: number;
    notes?: string;
    po_data?: {
        vendor_name: string;
        vendor_address: string;
        buyer_name: string;
        buyer_address: string;
        payment_terms: string;
        total_amount: number;
        line_items: Array<{
            name: string;
            description: string;
            quantity: number;
            unit_price: number;
        }>;
        order_date?: string;
        delivery_date?: string;
        shipping_address?: string;
        notes?: string;
    };
}

export interface IPOCreate {
    contract_id: number;
    template_type: POTemplateType;
    output_format: POOutputFormat;
    po_data: {
        vendor_name: string;
        vendor_address: string;
        vendor_phone?: string;
        vendor_email?: string;
        buyer_name: string;
        buyer_address: string;
        buyer_phone?: string;
        buyer_email?: string;
        payment_terms: string;
        total_amount: number;
        subtotal: number;
        tax: number;
        total: number;
        line_items: Array<{
            name: string;
            description: string;
            quantity: number;
            unit_price: number;
            total: number;
        }>;
        order_date?: string;
        delivery_date?: string;
        shipping_address?: string;
        notes?: string;
    };
    include_logo?: boolean;
    digital_signature?: boolean;
    send_notification?: boolean;
}

export interface IPOResponse {
    id: number;
    po_number: string;
    status: POStatus;
    [key: string]: any;
}

export enum POStatus {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED',
    PROCESSING = 'PROCESSING'
}

export enum POTemplateType {
    STANDARD = 'STANDARD',
    CUSTOM = 'CUSTOM',
    SIMPLIFIED = 'SIMPLIFIED'
}

export enum POOutputFormat {
    PDF = 'PDF',
    DOCX = 'DOCX',
    HTML = 'HTML'
}