import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, 'db.json');
const PORT = Number(process.env.PORT) || 3000;

interface TicketRecord {
  id: number | string;
  titre: string;
  description: string;
  demandeur: string;
  priorite: 'Basse' | 'Moyenne' | 'Haute';
  statut: 'Ouvert' | 'En cours' | 'Résolu' | 'Fermé';
  dateCreation: string;
}

interface CommentRecord {
  id: number | string;
  ticketId: number | string;
  auteur: string;
  contenu: string;
  date: string;
}

interface DbSchema {
  tickets: TicketRecord[];
  comments: CommentRecord[];
}

let writeQueue = Promise.resolve();

async function readDb(): Promise<DbSchema> {
  const raw = await fs.readFile(DB_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<DbSchema>;
  return {
    tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
    comments: Array.isArray(parsed.comments) ? parsed.comments : [],
  };
}

function writeDb(data: DbSchema): Promise<void> {
  const operation = writeQueue.then(() =>
    fs.writeFile(DB_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  );
  writeQueue = operation.catch(() => {});
  return operation;
}

function nextNumericId(items: Array<{ id: number | string }>): number {
  const ids = items
    .map((item) => Number(item.id))
    .filter((n) => Number.isFinite(n) && n > 0);
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API REST simulée sur db.json (compatible JSON Server) ---
  app.get('/api/tickets', async (req, res) => {
    try {
      const db = await readDb();
      let list = [...db.tickets];

      const { q, statut, priorite } = req.query;
      if (typeof statut === 'string' && statut) {
        list = list.filter((t) => t.statut === statut);
      }
      if (typeof priorite === 'string' && priorite) {
        list = list.filter((t) => t.priorite === priorite);
      }
      if (typeof q === 'string' && q.trim()) {
        const needle = q.trim().toLowerCase();
        list = list.filter(
          (t) =>
            t.titre.toLowerCase().includes(needle) ||
            t.description.toLowerCase().includes(needle) ||
            t.demandeur.toLowerCase().includes(needle)
        );
      }

      res.json(list);
    } catch {
      res.status(500).json({ error: 'Erreur lors de la lecture de db.json' });
    }
  });

  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const db = await readDb();
      const ticket = db.tickets.find((t) => String(t.id) === String(req.params.id));
      if (!ticket) {
        res.status(404).json({ error: 'Ticket introuvable' });
        return;
      }
      res.json(ticket);
    } catch {
      res.status(500).json({ error: 'Erreur lors de la lecture de db.json' });
    }
  });

  app.post('/api/tickets', async (req, res) => {
    try {
      const { titre, description, demandeur, priorite } = req.body ?? {};

      if (
        typeof titre !== 'string' ||
        !titre.trim() ||
        typeof description !== 'string' ||
        !description.trim() ||
        typeof demandeur !== 'string' ||
        !demandeur.trim()
      ) {
        res.status(400).json({
          error: 'Les champs titre, description et demandeur sont obligatoires.',
        });
        return;
      }

      const validPriorities = ['Basse', 'Moyenne', 'Haute'];
      const normalizedPriority = validPriorities.includes(priorite) ? priorite : 'Moyenne';

      const db = await readDb();
      const today = new Date().toISOString().slice(0, 10);
      const created: TicketRecord = {
        id: nextNumericId(db.tickets),
        titre: titre.trim(),
        description: description.trim(),
        demandeur: demandeur.trim(),
        priorite: normalizedPriority,
        statut: 'Ouvert',
        dateCreation: today,
      };

      db.tickets.push(created);
      await writeDb(db);
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'Erreur lors de la création du ticket' });
    }
  });

  app.put('/api/tickets/:id', async (req, res) => {
    try {
      const db = await readDb();
      const idx = db.tickets.findIndex((t) => String(t.id) === String(req.params.id));
      if (idx === -1) {
        res.status(404).json({ error: 'Ticket introuvable' });
        return;
      }

      const existing = db.tickets[idx];
      const { titre, description, demandeur, priorite, statut, dateCreation } = req.body ?? {};

      if (
        typeof titre !== 'string' ||
        !titre.trim() ||
        typeof description !== 'string' ||
        !description.trim() ||
        typeof demandeur !== 'string' ||
        !demandeur.trim()
      ) {
        res.status(400).json({
          error: 'Les champs titre, description et demandeur sont obligatoires.',
        });
        return;
      }

      const validPriorities = ['Basse', 'Moyenne', 'Haute'];
      const validStatuses = ['Ouvert', 'En cours', 'Résolu', 'Fermé'];

      const updated: TicketRecord = {
        id: existing.id,
        titre: titre.trim(),
        description: description.trim(),
        demandeur: demandeur.trim(),
        priorite: validPriorities.includes(priorite) ? priorite : existing.priorite,
        statut: validStatuses.includes(statut) ? statut : existing.statut,
        dateCreation:
          typeof dateCreation === 'string' && dateCreation.trim()
            ? dateCreation.trim()
            : existing.dateCreation,
      };

      db.tickets[idx] = updated;
      await writeDb(db);
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Erreur lors de la mise à jour du ticket' });
    }
  });

  app.patch('/api/tickets/:id', async (req, res) => {
    try {
      const db = await readDb();
      const idx = db.tickets.findIndex((t) => String(t.id) === String(req.params.id));
      if (idx === -1) {
        res.status(404).json({ error: 'Ticket introuvable' });
        return;
      }

      const existing = db.tickets[idx];
      const body = req.body ?? {};
      const validPriorities = ['Basse', 'Moyenne', 'Haute'];
      const validStatuses = ['Ouvert', 'En cours', 'Résolu', 'Fermé'];

      const updated: TicketRecord = {
        ...existing,
        titre: typeof body.titre === 'string' && body.titre.trim() ? body.titre.trim() : existing.titre,
        description:
          typeof body.description === 'string' && body.description.trim()
            ? body.description.trim()
            : existing.description,
        demandeur:
          typeof body.demandeur === 'string' && body.demandeur.trim()
            ? body.demandeur.trim()
            : existing.demandeur,
        priorite: validPriorities.includes(body.priorite) ? body.priorite : existing.priorite,
        statut: validStatuses.includes(body.statut) ? body.statut : existing.statut,
      };

      db.tickets[idx] = updated;
      await writeDb(db);
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Erreur lors de la mise à jour partielle du ticket' });
    }
  });

  app.delete('/api/tickets/:id', async (req, res) => {
    try {
      const db = await readDb();
      const idx = db.tickets.findIndex((t) => String(t.id) === String(req.params.id));
      if (idx === -1) {
        res.status(404).json({ error: 'Ticket introuvable' });
        return;
      }

      const [removed] = db.tickets.splice(idx, 1);
      db.comments = db.comments.filter((c) => String(c.ticketId) !== String(req.params.id));
      await writeDb(db);
      res.json(removed);
    } catch {
      res.status(500).json({ error: 'Erreur lors de la suppression du ticket' });
    }
  });

  // --- Collection comments (bonus relation ticketId) ---
  app.get('/api/comments', async (req, res) => {
    try {
      const db = await readDb();
      const { ticketId } = req.query;
      if (typeof ticketId === 'string' && ticketId) {
        res.json(db.comments.filter((c) => String(c.ticketId) === String(ticketId)));
        return;
      }
      res.json(db.comments);
    } catch {
      res.status(500).json({ error: 'Erreur lors de la lecture des commentaires' });
    }
  });

  app.post('/api/comments', async (req, res) => {
    try {
      const { ticketId, auteur, contenu } = req.body ?? {};
      if (
        !ticketId ||
        typeof auteur !== 'string' ||
        !auteur.trim() ||
        typeof contenu !== 'string' ||
        !contenu.trim()
      ) {
        res.status(400).json({ error: 'Auteur et contenu du commentaire requis.' });
        return;
      }

      const db = await readDb();
      const ticketExists = db.tickets.some((t) => String(t.id) === String(ticketId));
      if (!ticketExists) {
        res.status(404).json({ error: 'Ticket associé introuvable' });
        return;
      }

      const created: CommentRecord = {
        id: nextNumericId(db.comments),
        ticketId: Number.isFinite(Number(ticketId)) ? Number(ticketId) : ticketId,
        auteur: auteur.trim(),
        contenu: contenu.trim(),
        date: new Date().toISOString().slice(0, 10),
      };

      db.comments.push(created);
      await writeDb(db);
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: "Erreur lors de l'ajout du commentaire" });
    }
  });

  // --- Vite / Static SPA ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur Vue + API REST démarré sur http://localhost:${PORT}`);
  });
}

startServer();
