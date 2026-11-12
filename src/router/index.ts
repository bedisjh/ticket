import { createRouter, createWebHistory } from 'vue-router';
import ListeTickets from '../views/ListeTickets.vue';
import NouveauTicket from '../views/NouveauTicket.vue';
import DetailTicket from '../views/DetailTicket.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/tickets',
    },
    {
      path: '/tickets',
      name: 'liste-tickets',
      component: ListeTickets,
    },
    {
      path: '/tickets/nouveau',
      name: 'nouveau-ticket',
      component: NouveauTicket,
    },
    {
      path: '/tickets/:id',
      name: 'detail-ticket',
      component: DetailTicket,
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/tickets',
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
