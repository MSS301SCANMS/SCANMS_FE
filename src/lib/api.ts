// The develop-branch hooks share the same Gateway contract and Keycloak
// session as the active microservice screens. Unsupported legacy endpoints
// are rejected by services/api before a network request is sent.
export { default } from '../services/api';
