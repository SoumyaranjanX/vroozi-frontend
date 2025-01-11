// @ngrx/store v15.0.0
import { createAction, props } from '@ngrx/store';
import { 
    IContract, 
    IContractUpload, 
    ContractStatus 
} from '@shared/models/contract.model';

/**
 * Action type constants for contract-related operations
 * Provides type safety and centralized management of action types
 */
export const CONTRACT_ACTION_TYPES = {
    LOAD: '[Contract] Load Contracts',
    LOAD_SUCCESS: '[Contract] Load Contracts Success',
    LOAD_FAILURE: '[Contract] Load Contracts Failure',
    UPLOAD: '[Contract] Upload Contract',
    UPLOAD_SUCCESS: '[Contract] Upload Contract Success',
    UPLOAD_FAILURE: '[Contract] Upload Contract Failure',
    VALIDATE: '[Contract] Validate Contract',
    VALIDATE_SUCCESS: '[Contract] Validate Contract Success',
    VALIDATE_FAILURE: '[Contract] Validate Contract Failure',
    EXTRACT: '[Contract] Extract Contract Data',
    EXTRACT_SUCCESS: '[Contract] Extract Contract Data Success',
    EXTRACT_FAILURE: '[Contract] Extract Contract Data Failure',
    SELECT: '[Contract] Select Contract',
    CLEAR_SELECTED: '[Contract] Clear Selected Contract',
    CLEAR_ERROR: '[Contract] Clear Error',
    BATCH_UPLOAD: '[Contract] Batch Upload Contracts',
    BATCH_UPLOAD_SUCCESS: '[Contract] Batch Upload Success',
    BATCH_UPLOAD_FAILURE: '[Contract] Batch Upload Failure',
    REFRESH: '[Contract] Refresh Contracts'
} as const;

/**
 * Contract Loading Actions
 */
export const loadContracts = createAction(
    CONTRACT_ACTION_TYPES.LOAD,
    props<{ filters?: Record<string, unknown> }>()
);

export const loadContractsSuccess = createAction(
    CONTRACT_ACTION_TYPES.LOAD_SUCCESS,
    props<{ contracts: ReadonlyArray<IContract> }>()
);

export const loadContractsFailure = createAction(
    CONTRACT_ACTION_TYPES.LOAD_FAILURE,
    props<{ error: Record<string, string> }>()
);

/**
 * Contract Upload Actions
 */
export const uploadContract = createAction(
    CONTRACT_ACTION_TYPES.UPLOAD,
    props<{ contract: IContractUpload }>()
);

export const uploadContractSuccess = createAction(
    CONTRACT_ACTION_TYPES.UPLOAD_SUCCESS,
    props<{ contract: IContract }>()
);

export const uploadContractFailure = createAction(
    CONTRACT_ACTION_TYPES.UPLOAD_FAILURE,
    props<{ error: Record<string, string> }>()
);

/**
 * Batch Upload Actions
 */
export const batchUploadContracts = createAction(
    CONTRACT_ACTION_TYPES.BATCH_UPLOAD,
    props<{ contracts: ReadonlyArray<IContractUpload> }>()
);

export const batchUploadSuccess = createAction(
    CONTRACT_ACTION_TYPES.BATCH_UPLOAD_SUCCESS,
    props<{ contracts: ReadonlyArray<IContract> }>()
);

export const batchUploadFailure = createAction(
    CONTRACT_ACTION_TYPES.BATCH_UPLOAD_FAILURE,
    props<{ error: Record<string, string> }>()
);

/**
 * Contract Validation Actions
 */
export const validateContract = createAction(
    CONTRACT_ACTION_TYPES.VALIDATE,
    props<{ 
        id: string;
        validationData: Record<string, unknown>;
    }>()
);

export const validateContractSuccess = createAction(
    CONTRACT_ACTION_TYPES.VALIDATE_SUCCESS,
    props<{ 
        contract: IContract;
        status: ContractStatus;
    }>()
);

export const validateContractFailure = createAction(
    CONTRACT_ACTION_TYPES.VALIDATE_FAILURE,
    props<{ 
        id: string;
        error: Record<string, string>;
    }>()
);

/**
 * Contract Data Extraction Actions
 */
export const extractContractData = createAction(
    CONTRACT_ACTION_TYPES.EXTRACT,
    props<{ 
        id: string;
        options?: Record<string, unknown>;
    }>()
);

export const extractContractDataSuccess = createAction(
    CONTRACT_ACTION_TYPES.EXTRACT_SUCCESS,
    props<{ 
        contract: IContract;
        extractedData: Record<string, unknown>;
    }>()
);

export const extractContractDataFailure = createAction(
    CONTRACT_ACTION_TYPES.EXTRACT_FAILURE,
    props<{ 
        id: string;
        error: Record<string, string>;
    }>()
);

/**
 * Contract Selection Actions
 */
export const selectContract = createAction(
    CONTRACT_ACTION_TYPES.SELECT,
    props<{ id: string }>()
);

export const clearSelectedContract = createAction(
    CONTRACT_ACTION_TYPES.CLEAR_SELECTED
);

/**
 * Contract Refresh Action
 */
export const refreshContracts = createAction(
    CONTRACT_ACTION_TYPES.REFRESH
);

/**
 * Error Management Actions
 */
export const clearContractError = createAction(
    CONTRACT_ACTION_TYPES.CLEAR_ERROR
);