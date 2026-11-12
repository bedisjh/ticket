import axios from 'axios';
import type {
  CommentaireTicket,
  StatutTicket,
  Ticket,
  TicketCreationPayload,
  TicketModificationPayload,
} from '../types/ticket';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const STATUTS_ORDRE: StatutTicket[] = ['Ouvert', 'En cours', 'Résolu', 'Fermé'];

export const PRIORITES_LISTE = ['Basse', 'Moyenne', 'Haute'] as const;

export function getStatutSuivant(statut: StatutTicket): StatutTicket | null {
  const index = STATUTS_ORDRE.indexOf(statut);
  if (index === -1 || index >= STATUTS_ORDRE.length - 1) return null;
  return STATUTS_ORDRE[index + 1];
}

export function extraireMessageErreur(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      if (err.response.status === 404) {
        return 'Ressource introuvable (404).';
      }
      const data = err.response.data as { error?: string } | undefined;
      return data?.error || `Erreur serveur (HTTP ${err.response.status}).`;
    }
    if (err.request) {
      return 'Impossible de joindre le serveur API. Vérifiez que le serveur est démarré.';
    }
  }
  return 'Une erreur inattendue est survenue.';
}

export function estErreur404(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await api.get<Ticket[]>('/tickets');
  return response.data;
}

export async function getTicket(id: number | string): Promise<Ticket> {
  const response = await api.get<Ticket>(`/tickets/${id}`);
  return response.data;
}

export async function createTicket(data: TicketCreationPayload): Promise<Ticket> {
  const payload = {
    titre: data.titre.trim(),
    description: data.description.trim(),
    demandeur: data.demandeur.trim(),
    priorite: data.priorite,
    statut: 'Ouvert' as const,
    dateCreation: new Date().toISOString().slice(0, 10),
  };
  const response = await api.post<Ticket>('/tickets', payload);
  return response.data;
}

export async function updateTicket(
  id: number | string,
  data: TicketModificationPayload
): Promise<Ticket> {
  const response = await api.put<Ticket>(`/tickets/${id}`, {
    titre: data.titre.trim(),
    description: data.description.trim(),
    demandeur: data.demandeur.trim(),
    priorite: data.priorite,
    statut: data.statut,
    dateCreation: data.dateCreation,
  });
  return response.data;
}

export async function patchTicket(
  id: number | string,
  data: Partial<TicketModificationPayload>
): Promise<Ticket> {
  const response = await api.patch<Ticket>(`/tickets/${id}`, data);
  return response.data;
}

export async function deleteTicket(id: number | string): Promise<void> {
  await api.delete(`/tickets/${id}`);
}

export async function getComments(ticketId: number | string): Promise<CommentaireTicket[]> {
  const response = await api.get<CommentaireTicket[]>('/comments', {
    params: { ticketId },
  });
  return response.data;
}

export async function createComment(data: {
  ticketId: number | string;
  auteur: string;
  contenu: string;
}): Promise<CommentaireTicket> {
  const response = await api.post<CommentaireTicket>('/comments', {
    ticketId: data.ticketId,
    auteur: data.auteur.trim(),
    contenu: data.contenu.trim(),
    date: new Date().toISOString().slice(0, 10),
  });
  return response.data;
}
