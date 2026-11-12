export type PrioriteTicket = 'Basse' | 'Moyenne' | 'Haute';

export type StatutTicket = 'Ouvert' | 'En cours' | 'Résolu' | 'Fermé';

export interface Ticket {
  id: number;
  titre: string;
  description: string;
  demandeur: string;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  dateCreation: string;
}

export interface TicketCreationPayload {
  titre: string;
  description: string;
  demandeur: string;
  priorite: PrioriteTicket;
}

export interface TicketModificationPayload {
  titre: string;
  description: string;
  demandeur: string;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  dateCreation?: string;
}

export interface CommentaireTicket {
  id: number;
  ticketId: number;
  auteur: string;
  contenu: string;
  date: string;
}
