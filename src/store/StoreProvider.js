import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  apiConfigured,
  completePasswordReset,
  createCustomerOrder,
  getCustomerProfile,
  getCustomerOrders,
  getProducts,
  loginAccount,
  registerAccount,
  requestPasswordReset,
  saveCustomerDeliveryMessage,
} from '../lib/api';
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  storeAccessToken,
} from '../lib/session';

const StoreContext = createContext(null);
const backendConfigured = apiConfigured;
const EMPTY_ORDERS = [];

export const ORDER_STATUSES = ['Processing', 'Confirmed', 'Dispatched', 'Out for delivery', 'Delivered'];

const STATUS_KEYS = {
  Processing: 'statusProcessing',
  Confirmed: 'statusConfirmed',
  Dispatched: 'statusDispatched',
  'Out for delivery': 'statusOutForDelivery',
  Delivered: 'statusDelivered',
};

const COPY = {
  en: {
    shop: 'Shop', orders: 'Orders', cart: 'Bag', profile: 'Profile', search: 'Search products',
    all: 'All', under25: 'Under RWF 25k', hello: 'A little something, just for you.',
    featured: 'Curated for you', newArrivals: 'New arrivals', add: 'Add to bag',
    added: 'Added to your bag', emptyCart: 'Your bag is taking a little break.',
    emptyOrders: 'Your orders will show up here.', checkout: 'Continue to checkout',
    subtotal: 'Subtotal', delivery: 'Delivery', total: 'Total', placeOrder: 'Place order',
    login: 'Sign in', register: 'Create account', language: 'Language', signOut: 'Sign out', view: 'View', toBag: 'in bag',
    welcome: 'Welcome to D&G', address: 'Delivery address', payment: 'Payment method',
    orderPlaced: 'Order placed', orderNumber: 'Order number', shopNow: 'Explore the collection',
    noProducts: 'No products match. Try another search or category.',
    location: 'RWAMAGANA · RWANDA', landingImage: 'A curated D&G bag from the collection',
    landingImageBadge: 'THE RWANDA EDIT', landingEyebrow: 'A LITTLE SOMETHING, JUST FOR YOU',
    landingTitle: 'Everyday finds, thoughtfully chosen.',
    landingDescription: 'Discover clothing, shoes, bags, home details, and beauty favourites picked for your everyday.',
    landingShop: 'Explore the collection', landingFooterTitle: 'A little more joy in your everyday.',
    landingFooterCopy: 'Browse the collection, find your favourites, and enjoy a simple local demo shopping experience.',
    customer: 'Customer', seller: 'Seller', sellerLogin: 'Seller sign in',
    accountType: 'ACCOUNT TYPE', customerRegisterCopy: 'Create a customer account to keep your orders together.',
    customerLoginCopy: 'Sign in to continue your D&G shopping experience.',
    sellerLoginCopy: 'Sign in to continue to the D&G seller demo.',
    forgotPassword: 'Forgot password?',
    recoveryCopy: 'Enter your email address to get help accessing your account.',
    recoveryDemoNotice: 'A password reset link will be sent to your email address.',
    recoverySetupNotice: 'Password recovery needs SMTP email settings on the server.',
    resetPassword: 'Set a new password',
    resetPasswordCopy: 'Choose a new password for your D&G account.',
    resetPasswordInvalid: 'This reset link is invalid or has expired. Request a new one.',
    resetPasswordSuccess: 'Your password has been reset. You can now sign in.',
    recoveryInvalidEmail: 'Enter a valid email address.',
    recoveryNotSent: 'If an account exists for this email, a password reset link will arrive shortly.',
    emailAddress: 'Email address', continue: 'Continue', backToLogin: 'Back to sign in',
    password: 'Password', passwordRequirements: 'Use at least 8 characters.',
    demoAuthNotice: 'Sign-in uses your D&G account. The catalog is stored in the shop database; payment options are samples.',
    authNotice: 'Your account is securely managed by the D&G shop API.',
    backendSetupNotice: 'The Render API is not configured. Set EXPO_PUBLIC_API_URL in .env.local, then restart Expo.',
    authSetupNotice: 'The Render API is not configured. Set EXPO_PUBLIC_API_URL in .env.local, then restart Expo.',
    recoveryEmailSent: 'If an account exists for this email, a password reset link will arrive shortly.',
    checkingAccount: 'Checking your signed-in account…', loadingOrders: 'Loading your orders…',
    loadingProducts: 'Loading products…',
    orderHistoryCloudNote: 'Your order history is saved to your account.',
    customerAccount: 'Customer account', sellerAccount: 'Seller account',
    yourDg: 'YOUR D&G', account: 'ACCOUNT', orderHistory: 'Order history',
    storeReports: 'Store reports', profileGreeting: 'Your little corner at D&G',
    demoMode: 'DEMO MODE',
    demoCopy: 'Customer accounts, products, and order history use the shop API and database. Payment options are samples; no payment is processed.',
    categoryClothing: 'Clothing', categoryShoes: 'Shoes', categoryBags: 'Bags', categoryHome: 'Home', categoryBeauty: 'Beauty',
    items: 'items', product: 'product', back: 'Back', backToShop: 'Back to shop', backToProfile: 'Back to profile',
    goodThings: 'Good things,', madeToLast: 'made to last.', findFavourite: 'Find your new favourite.', rwandaEdit: 'THE RWANDA EDIT',
    resultItems: 'items', demoCatalogue: 'Demo catalogue · Sample prices · No payment is processed',
    emptyCartBrowse: 'The good stuff is just a browse away.', demoCheckout: 'Demo checkout only · No payment will be taken',
    almostYours: 'ALMOST YOURS', signInPlaceOrder: 'Sign in to place your order', checkoutAccountCopy: 'Your order will be saved to your account.',
    createDemoAccount: 'Create an account', fullName: 'Full name', nameForDelivery: 'Name for delivery', phoneNumber: 'Phone number', streetArea: 'Street / area', streetPlaceholder: 'House, street or neighbourhood',
    demoPayment: 'Demo payment selection only. No money or card details are collected.', cashOnDelivery: 'Cash on delivery', mobileMoneyDemo: 'Mobile money (demo)', orderSummary: 'Order summary', demoCheckoutFooter: 'Demo checkout · No payment is processed',
    checkoutCompleteDetails: 'Complete all delivery details before placing your order.', checkoutInvalidEmail: 'Enter a valid email address.', checkoutEmptyBag: 'Your bag is empty. Add an item before checkout.',
    orderDetails: 'THE DETAILS', ordersOnePlace: 'Your orders, all in one place.', signInOrderHistory: 'Sign in to see your order history.', ordersLoveCopy: 'Once you find something you love, it’ll be here.', order: 'ORDER', trackOrder: 'Track order', demoOrderHistory: 'Your order history is synced to your account.',
    yourOrder: 'YOUR D&G ORDER', trackYourOrder: 'Track your order', deliveryProgress: 'Delivery progress', currentStatus: 'Current order status', completed: 'Completed', nextStep: 'Next step', simulateNextUpdate: 'Simulate next update', finalStatus: 'Your order has reached its final delivery status.',
    trackingManagedByStore: 'Order status updates are managed by the store.',
    deliveryConfirmation: 'Confirm delivery', deliveryMessageHelp: 'Let us know your order arrived. Your message will be saved with this order and shared with the store.', deliveryMessagePlaceholder: 'Write your delivery message', sendDeliveryMessage: 'Send delivery message', updateDeliveryMessage: 'Update delivery message', deliveryMessageSaved: 'Your message is saved with this order.',
    downloadPurchaseSummary: 'Download purchase summary', purchaseSummaryReady: 'Your CSV purchase summary is ready.', purchaseSummaryError: 'Unable to create the purchase summary', noPurchaseSummary: 'There are no purchased items to include yet.',
    deliveryDetails: 'Delivery details', demoCustomer: 'Customer', trackingSimulated: 'Order status updates are managed by the store.', placed: 'Placed', unavailableOrder: 'This order is unavailable in your account.',
    productNotFound: 'Product not found', productNotFoundCopy: 'This item is not in the demo collection.', customerFavourite: 'Customer favourite', productDescription: 'A thoughtfully chosen D&G everyday essential. Designed to bring a little more joy to your routine.', theDetails: 'The details', rwandaSample: 'Selected for the Rwanda edit · Sample product for this demo', viewYourBag: 'View your bag', demoProduct: 'Demo product · Sample pricing · No purchase is charged', decreaseQuantity: 'Decrease quantity', increaseQuantity: 'Increase quantity',
    statusProcessing: 'Processing', statusConfirmed: 'Confirmed', statusDispatched: 'Dispatched', statusOutForDelivery: 'Out for delivery', statusDelivered: 'Delivered',
    reports: 'Order summary', reportsEyebrow: 'ACCOUNT SUMMARY', reportsTab: 'Reports', reportsCopy: 'A summary of orders saved to your account.', revenue: 'TOTAL ORDER VALUE', ordersMetric: 'ORDERS', itemsMetric: 'ITEMS', deliveredMetric: 'DELIVERED', orderStatusSummary: 'ORDERS BY STATUS', reportsEmpty: 'Your placed orders will appear here.', reportsNote: 'Order history is saved in the shop database. Products and payment options are samples; no payment is processed.', viewOrders: 'View orders', yourPicks: 'YOUR PICKS',
  },
  fr: {
    shop: 'Boutique', orders: 'Commandes', cart: 'Panier', profile: 'Profil', search: 'Rechercher',
    all: 'Tout', under25: 'Moins de 25 000 RWF', hello: 'Une petite attention, rien que pour vous.',
    featured: 'Choisi pour vous', newArrivals: 'Nouveautés', add: 'Ajouter au panier',
    added: 'Ajouté à votre panier', emptyCart: 'Votre panier est encore vide.',
    emptyOrders: 'Vos commandes apparaîtront ici.', checkout: 'Passer à la caisse',
    subtotal: 'Sous-total', delivery: 'Livraison', total: 'Total', placeOrder: 'Passer la commande',
    login: 'Se connecter', register: 'Créer un compte', language: 'Langue', signOut: 'Déconnexion', view: 'Voir', toBag: 'dans le panier',
    welcome: 'Bienvenue chez D&G', address: 'Adresse de livraison', payment: 'Mode de paiement',
    orderPlaced: 'Commande passée', orderNumber: 'Numéro de commande', shopNow: 'Découvrir la collection',
    noProducts: 'Aucun produit ne correspond. Essayez une autre recherche ou catégorie.',
    location: 'RWAMAGANA · RWANDA', landingImage: 'Un sac D&G sélectionné dans la collection',
    landingImageBadge: 'LA SÉLECTION DU RWANDA', landingEyebrow: 'UNE PETITE ATTENTION, RIEN QUE POUR VOUS',
    landingTitle: 'Des essentiels choisis avec soin.',
    landingDescription: 'Découvrez des vêtements, chaussures, sacs, objets pour la maison et essentiels beauté pour votre quotidien.',
    landingShop: 'Découvrir la collection', landingFooterTitle: 'Un peu plus de joie au quotidien.',
    landingFooterCopy: 'Parcourez la collection, trouvez vos favoris et profitez d’une expérience de démonstration simple et locale.',
    customer: 'Client', seller: 'Vendeur', sellerLogin: 'Connexion vendeur',
    accountType: 'TYPE DE COMPTE', customerRegisterCopy: 'Créez un compte client pour retrouver vos commandes.',
    customerLoginCopy: 'Connectez-vous pour continuer votre expérience D&G.',
    sellerLoginCopy: 'Connectez-vous pour accéder à la démonstration vendeur D&G.',
    forgotPassword: 'Mot de passe oublié ?',
    recoveryCopy: 'Saisissez votre adresse e-mail pour obtenir de l’aide avec votre compte.',
    recoveryDemoNotice: 'Un lien de réinitialisation sera envoyé à votre adresse e-mail.',
    recoverySetupNotice: 'La récupération du mot de passe nécessite une configuration SMTP sur le serveur.',
    resetPassword: 'Définir un nouveau mot de passe',
    resetPasswordCopy: 'Choisissez un nouveau mot de passe pour votre compte D&G.',
    resetPasswordInvalid: 'Ce lien est invalide ou expiré. Demandez-en un nouveau.',
    resetPasswordSuccess: 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.',
    recoveryInvalidEmail: 'Saisissez une adresse e-mail valide.',
    recoveryNotSent: 'Si un compte existe pour cette adresse, un lien de réinitialisation arrivera bientôt.',
    emailAddress: 'Adresse e-mail', continue: 'Continuer', backToLogin: 'Retour à la connexion',
    password: 'Mot de passe', passwordRequirements: 'Utilisez au moins 8 caractères.',
    demoAuthNotice: 'La connexion utilise votre compte D&G. Le catalogue est enregistré dans la base de données ; les paiements sont des exemples.',
    authNotice: 'Votre compte est géré de manière sécurisée par l’API D&G.',
    backendSetupNotice: 'L’API Render n’est pas configurée. Ajoutez EXPO_PUBLIC_API_URL dans .env.local, puis redémarrez Expo.',
    authSetupNotice: 'L’API Render n’est pas configurée. Ajoutez EXPO_PUBLIC_API_URL dans .env.local, puis redémarrez Expo.',
    recoveryEmailSent: 'Si un compte existe pour cette adresse, un lien de réinitialisation arrivera bientôt.',
    checkingAccount: 'Vérification du compte…', loadingOrders: 'Chargement des commandes…',
    loadingProducts: 'Chargement des produits…',
    orderHistoryCloudNote: 'Votre historique est enregistré avec votre compte.',
    customerAccount: 'Compte client', sellerAccount: 'Compte vendeur',
    yourDg: 'VOTRE D&G', account: 'COMPTE', orderHistory: 'Historique des commandes',
    storeReports: 'Rapports du magasin', profileGreeting: 'Votre petit coin chez D&G',
    demoMode: 'MODE DÉMO',
    demoCopy: 'Les comptes, produits et commandes utilisent l’API et la base de données. Les paiements sont des exemples ; aucun paiement n’est traité.',
    categoryClothing: 'Vêtements', categoryShoes: 'Chaussures', categoryBags: 'Sacs', categoryHome: 'Maison', categoryBeauty: 'Beauté',
    items: 'articles', product: 'produit', back: 'Retour', backToShop: 'Retour à la boutique', backToProfile: 'Retour au profil',
    goodThings: 'De belles choses,', madeToLast: 'faites pour durer.', findFavourite: 'Trouvez votre coup de cœur.', rwandaEdit: 'LA SÉLECTION DU RWANDA',
    resultItems: 'articles', demoCatalogue: 'Catalogue de démonstration · Prix indicatifs · Aucun paiement effectué',
    emptyCartBrowse: 'Les belles trouvailles sont à un clic.', demoCheckout: 'Paiement de démonstration · Aucun paiement ne sera effectué',
    almostYours: 'PRESQUE À VOUS', signInPlaceOrder: 'Connectez-vous pour passer la commande', checkoutAccountCopy: 'Votre commande sera enregistrée dans votre compte.',
    createDemoAccount: 'Créer un compte', fullName: 'Nom complet', nameForDelivery: 'Nom pour la livraison', phoneNumber: 'Numéro de téléphone', streetArea: 'Rue / quartier', streetPlaceholder: 'Maison, rue ou quartier',
    demoPayment: 'Sélection de paiement de démonstration. Aucun argent ni détail bancaire n’est collecté.', cashOnDelivery: 'Paiement à la livraison', mobileMoneyDemo: 'Mobile money (démo)', orderSummary: 'Résumé de la commande', demoCheckoutFooter: 'Paiement démo · Aucun paiement n’est traité',
    checkoutCompleteDetails: 'Renseignez toutes les informations de livraison avant de passer la commande démo.', checkoutInvalidEmail: 'Saisissez une adresse e-mail valide.', checkoutEmptyBag: 'Votre panier est vide. Ajoutez un article avant de passer commande.',
    orderDetails: 'LES DÉTAILS', ordersOnePlace: 'Vos commandes, réunies au même endroit.', signInOrderHistory: 'Connectez-vous pour voir votre historique.', ordersLoveCopy: 'Après avoir trouvé ce que vous aimez, la commande apparaîtra ici.', order: 'COMMANDE', trackOrder: 'Suivre la commande', demoOrderHistory: 'Votre historique est synchronisé avec votre compte.',
    yourOrder: 'VOTRE COMMANDE D&G', trackYourOrder: 'Suivre votre commande', deliveryProgress: 'Progression de la livraison', currentStatus: 'Statut actuel', completed: 'Terminé', nextStep: 'Étape suivante', simulateNextUpdate: 'Simuler une mise à jour', finalStatus: 'Votre commande a atteint son statut final.',
    trackingManagedByStore: 'Les mises à jour du statut sont gérées par le magasin.',
    deliveryConfirmation: 'Confirmer la livraison', deliveryMessageHelp: 'Confirmez la réception de votre commande. Votre message sera enregistré avec la commande et transmis au magasin.', deliveryMessagePlaceholder: 'Écrivez votre message de livraison', sendDeliveryMessage: 'Envoyer le message', updateDeliveryMessage: 'Modifier le message', deliveryMessageSaved: 'Votre message est enregistré avec cette commande.',
    downloadPurchaseSummary: 'Télécharger le résumé des achats', purchaseSummaryReady: 'Votre résumé des achats CSV est prêt.', purchaseSummaryError: 'Impossible de créer le résumé des achats', noPurchaseSummary: 'Aucun article acheté à inclure pour le moment.',
    deliveryDetails: 'Informations de livraison', demoCustomer: 'Client démo', trackingSimulated: 'Le suivi est simulé localement pour cette démo. Aucun service de livraison n’est connecté.', placed: 'Passée le', unavailableOrder: 'Cette commande est indisponible dans la session démo actuelle.',
    productNotFound: 'Produit introuvable', productNotFoundCopy: 'Cet article ne fait pas partie de la collection de démonstration.', customerFavourite: 'Favori des clients', productDescription: 'Un essentiel D&G choisi avec soin. Conçu pour apporter un peu plus de joie à votre quotidien.', theDetails: 'Les détails', rwandaSample: 'Sélectionné pour l’édition Rwanda · Produit de démonstration', viewYourBag: 'Voir votre panier', demoProduct: 'Produit de démonstration · Prix indicatifs · Aucun achat facturé', decreaseQuantity: 'Diminuer la quantité', increaseQuantity: 'Augmenter la quantité',
    statusProcessing: 'En traitement', statusConfirmed: 'Confirmée', statusDispatched: 'Expédiée', statusOutForDelivery: 'En cours de livraison', statusDelivered: 'Livrée',
    reports: 'Résumé des commandes', reportsEyebrow: 'RÉSUMÉ DU COMPTE', reportsTab: 'Rapports', reportsCopy: 'Résumé des commandes enregistrées dans votre compte.', revenue: 'VALEUR TOTALE DES COMMANDES', ordersMetric: 'COMMANDES', itemsMetric: 'ARTICLES', deliveredMetric: 'LIVRÉES', orderStatusSummary: 'COMMANDES PAR STATUT', reportsEmpty: 'Vos commandes apparaîtront ici.', reportsNote: 'L’historique est enregistré dans la base de données. Les produits et paiements sont des exemples ; aucun paiement n’est traité.', viewOrders: 'Voir les commandes', yourPicks: 'VOS CHOIX',
  },
  rw: {
    shop: 'Iduka', orders: 'Amabwiriza', cart: 'Agaseke', profile: 'Umwirondoro', search: 'Shakisha ibicuruzwa',
    all: 'Byose', under25: 'Munsi ya RWF 25k', hello: 'Icyiza gito, kigenewe wowe.',
    featured: 'Byatoranyirijwe wowe', newArrivals: 'Ibishya', add: 'Shyira mu gaseke',
    added: 'Byashyizwe mu gaseke', emptyCart: 'Agaseke kawe karacyategereje.',
    emptyOrders: 'Amabwiriza yawe azagaragara hano.', checkout: 'Komeza wishyure',
    subtotal: 'Igiteranyo', delivery: 'Kugeza ibicuruzwa', total: 'Igiteranyo cyose', placeOrder: 'Ohereza ibyo watumije',
    login: 'Injira', register: 'Fungura konti', language: 'Ururimi', signOut: 'Sohoka', view: 'Reba', toBag: 'mu gaseke',
    welcome: 'Murakaza neza kuri D&G', address: 'Aderesi yo kugeza ibicuruzwa', payment: 'Uburyo bwo kwishyura',
    orderPlaced: 'Ibyo watumije byakiriwe', orderNumber: 'Nimero y’ibyo watumije', shopNow: 'Reba ibicuruzwa',
    yourDg: 'AHO URI KURI D&G', account: 'KONTI', orderHistory: 'Amateka y’ibyo watumije',
    storeReports: 'Raporo z’iduka', profileGreeting: 'Aho ugira ibyawe kuri D&G',
    demoMode: 'UBURYO BW’IGERAGEZA',
    demoCopy: 'Konti, ibicuruzwa n’ibyo watumije bikoresha API na database. Uburyo bwo kwishyura ni iby’icyitegererezo; nta mafaranga yishyurwa.',
    noProducts: 'Nta bicuruzwa bihuye n’ibyo ushaka. Gerageza gushakisha ukundi cyangwa uhitemo ikindi cyiciro.',
    location: 'RWAMAGANA · RWANDA', landingImage: 'Isakoshi ya D&G yatoranyijwe mu bicuruzwa',
    landingImageBadge: 'IBYATORANYIJWE MU RWANDA', landingEyebrow: 'ICYO UMWIFURIZA, NI ICYO AKWIFURIZA',
    landingTitle: 'Ibintu byiza byatoranyijwe neza.',
    landingDescription: 'Reba imyenda, inkweto, amasakoshi, ibikoresho byo mu rugo n’ibyo kwisiga byagufasha mu buzima bwa buri munsi.',
    landingShop: 'Reba ibicuruzwa', landingFooterTitle: 'Ibyishimo byinshi mu buzima bwa buri munsi.',
    landingFooterCopy: 'Reba ibicuruzwa, uhitemo ibyo ukunda kandi ukoreshe uru rubuga rw’igerageza rworoshye.',
    customer: 'Umukiriya', seller: 'Umucuruzi', sellerLogin: 'Injira nk’umucuruzi',
    accountType: 'UBWOKO BWA KONTI', customerRegisterCopy: 'Fungura konti y’umukiriya kugira ngo ubike ibyo watumije.',
    customerLoginCopy: 'Injira ukomeze gukoresha D&G.',
    sellerLoginCopy: 'Injira ukomeze gukoresha D&G nk’umucuruzi mu igerageza.',
    forgotPassword: 'Wibagiwe ijambobanga?',
    recoveryCopy: 'Andika imeyili yawe kugira ngo ubone ubufasha bwo kwinjira muri konti.',
    recoveryDemoNotice: 'Urahabwa ubutumwa burimo uburyo bwo guhindura ijambobanga.',
    recoverySetupNotice: 'Guhindura ijambobanga bisaba SMTP yashyizweho kuri server.',
    resetPassword: 'Shyiraho ijambobanga rishya',
    resetPasswordCopy: 'Hitamo ijambobanga rishya rya konti yawe ya D&G.',
    resetPasswordInvalid: 'Ubu buryo bwo guhindura ijambobanga bwarengeje igihe cyangwa si bwo. Saba ubundi.',
    resetPasswordSuccess: 'Ijambobanga ryawe ryahinduwe. Ushobora kwinjira.',
    recoveryInvalidEmail: 'Andika imeyili yemewe.',
    recoveryNotSent: 'Niba konti iriho kuri iyi imeyili, urahabwa ubutumwa burimo uburyo bwo guhindura ijambobanga.',
    emailAddress: 'Imeyili', continue: 'Komeza', backToLogin: 'Subira ku kwinjira',
    password: 'Ijambobanga', passwordRequirements: 'Koresha inyuguti nibura 8.',
    demoAuthNotice: 'Kwinjira ukoresheje konti yawe ya D&G. Ibicuruzwa bibikwa muri database; uburyo bwo kwishyura ni iby’icyitegererezo.',
    authNotice: 'Konti yawe irinzwe na API y’iduka rya D&G.',
    backendSetupNotice: 'API ya Render ntirashyirwaho. Ongeramo EXPO_PUBLIC_API_URL muri .env.local, wongere utangize Expo.',
    authSetupNotice: 'API ya Render ntirashyirwaho. Ongeramo EXPO_PUBLIC_API_URL muri .env.local, wongere utangize Expo.',
    recoveryEmailSent: 'Niba konti iriho kuri iyi imeyili, urahabwa ubutumwa burimo uburyo bwo guhindura ijambobanga.',
    checkingAccount: 'Turimo kugenzura konti…', loadingOrders: 'Turimo gufungura ibyo watumije…',
    loadingProducts: 'Turimo gufungura ibicuruzwa…',
    orderHistoryCloudNote: 'Amateka y’ibyo watumije abikwa kuri konti yawe.',
    customerAccount: 'Konti y’umukiriya', sellerAccount: 'Konti y’umucuruzi',
    categoryClothing: 'Imyenda', categoryShoes: 'Inkweto', categoryBags: 'Amasakoshi', categoryHome: 'Ibikoresho byo mu rugo', categoryBeauty: 'Ubwiza',
    items: 'ibicuruzwa', product: 'igicuruzwa', back: 'Subira inyuma', backToShop: 'Subira ku bicuruzwa', backToProfile: 'Subira ku mwirondoro',
    goodThings: 'Ibintu byiza,', madeToLast: 'byakozwe ngo bimare igihe.', findFavourite: 'Shaka icyo ukunda.', rwandaEdit: 'IBYATORANYIJWE MU RWANDA',
    resultItems: 'ibicuruzwa', demoCatalogue: 'Iby’igerageza · Ibiciro by’icyitegererezo · Nta kwishyura bikorwa',
    emptyCartBrowse: 'Ibintu byiza biri hafi: gusa reba ibicuruzwa.', demoCheckout: 'Kwishyura kw’igerageza gusa · Nta mafaranga azafatwa',
    almostYours: 'BIGIHEZE HAFI YAWE', signInPlaceOrder: 'Injira kugira ngo utange icyo watumije', checkoutAccountCopy: 'Icyo utumije kirabikwa kuri konti yawe.',
    createDemoAccount: 'Fungura konti', fullName: 'Izina ryuzuye', nameForDelivery: 'Izina ryo kugeza ibicuruzwa', phoneNumber: 'Nimero ya telefone', streetArea: 'Umuhanda / aho uherereye', streetPlaceholder: 'Inzu, umuhanda cyangwa agace',
    demoPayment: 'Guhitamo uburyo bwo kwishyura ni igerageza. Nta mafaranga cyangwa amakuru y’ikarita akusanywa.', cashOnDelivery: 'Kwishyura igihe ibicuruzwa bigeze', mobileMoneyDemo: 'Mobile money (igerageza)', orderSummary: 'Incamake y’ibyo watumije', demoCheckoutFooter: 'Kwishyura kw’igerageza · Nta kwishyura bikorwa',
    checkoutCompleteDetails: 'Uzuza amakuru yose yo kugeza ibicuruzwa mbere yo gutanga icyatanzwe.', checkoutInvalidEmail: 'Andika imeyili yemewe.', checkoutEmptyBag: 'Agaseke kawe karimo ubusa. Ongeramo igicuruzwa mbere yo kwishyura.',
    orderDetails: 'IBISOBANURO', ordersOnePlace: 'Ibyo watumije, byose ahantu hamwe.', signInOrderHistory: 'Injira kugira ngo urebe amateka y’ibyo watumije.', ordersLoveCopy: 'Uhege ukunda igicuruzwa, kizamugaragaza hano.', order: 'ICYATUMIJE', trackOrder: 'Kurikira icyatanzwe', demoOrderHistory: 'Amateka y’ibyo watumije ahuzwa na konti yawe.',
    yourOrder: 'ICYO WATUMIZIJE CYA D&G', trackYourOrder: 'Kurikira icyatanzwe', deliveryProgress: 'Iterambere ryo kugeza', currentStatus: 'Uko icyatanzwe kimeze', completed: 'Byarangiye', nextStep: 'Intambwe ikurikira', simulateNextUpdate: 'Gerageza kuvugurura', finalStatus: 'Icyo watumije cyageze ku rwego rwa nyuma.',
    trackingManagedByStore: 'Amakuru mashya y’uko icyatanzwe kimeze atangwa n’iduka.',
    deliveryConfirmation: 'Emeza ko ibicuruzwa byagejejwe', deliveryMessageHelp: 'Tumenyeshe ko wakiriye ibyo watumije. Ubutumwa bwawe burabikwa ku cyatanzwe kandi bukagezwa ku iduka.', deliveryMessagePlaceholder: 'Andika ubutumwa bwo kwakira ibicuruzwa', sendDeliveryMessage: 'Ohereza ubutumwa', updateDeliveryMessage: 'Hindura ubutumwa', deliveryMessageSaved: 'Ubutumwa bwawe bwabitswe kuri iri tumiza.',
    downloadPurchaseSummary: 'Kuramo incamake y’ibyo waguze', purchaseSummaryReady: 'Incamake ya CSV y’ibyo waguze yiteguye.', purchaseSummaryError: 'Ntibyashobotse gukora incamake y’ibyo waguze', noPurchaseSummary: 'Nta bicuruzwa byaguzwe bihari byo gushyira muri iyi ncamake.',
    deliveryDetails: 'Amakuru yo kugeza ibicuruzwa', demoCustomer: 'Umukiriya w’igerageza', trackingSimulated: 'Gukurikirana bikorwa mu buryo bw’igerageza kuri iki gikoresho. Nta serivisi yo gutanga.', placed: 'Byashyizwe ku munsi wa', unavailableOrder: 'Iki cyatanzwe ntikibonetse muri iki gihe cy’igerageza.',
    productNotFound: 'Igicuruzwa ntikibonetse', productNotFoundCopy: 'Iki gicuruzwa ntikiri mu bicuruzwa by’igerageza.', customerFavourite: 'Igicuruzwa abakiriya bakunda', productDescription: 'Igicuruzwa cya D&G cyatoranyijwe neza. Cyagenewe kongerera umunsi wawe ibyishimo.', theDetails: 'Ibisobanuro', rwandaSample: 'Byatoranyirijwe Rwanda · Igicuruzwa cy’icyitegererezo', viewYourBag: 'Reba agaseke kawe', demoProduct: 'Igicuruzwa cy’igerageza · Ibiciro by’icyitegererezo · Nta kugura bikozwe', decreaseQuantity: 'Gabanya ubwinshi', increaseQuantity: 'Ongera ubwinshi',
    statusProcessing: 'Birimo gukorwa', statusConfirmed: 'Byemejwe', statusDispatched: 'Byoherejwe', statusOutForDelivery: 'Biri mu nzira', statusDelivered: 'Byagejejwe',
    reports: 'Incamake y’ibyo watumije', reportsEyebrow: 'INCAMAKE YA KONTI', reportsTab: 'Raporo', reportsCopy: 'Incamake y’ibyo watumije bibitswe kuri konti yawe.', revenue: 'AGACIRO K’IBYO WATUMIJE', ordersMetric: 'IBYATANZWE', itemsMetric: 'IBICURUZWA', deliveredMetric: 'BYAGEZE', orderStatusSummary: 'IBYATANZWE UKO BIMEZE', reportsEmpty: 'Ibyo watumije bizagaragara hano.', reportsNote: 'Amateka abikwa muri database y’iduka. Ibicuruzwa n’uburyo bwo kwishyura ni iby’icyitegererezo; nta mafaranga yishyurwa.', viewOrders: 'Reba ibyo watumije', yourPicks: 'IBYO UHITAMO',
  },
};

const PRODUCT_NAMES = {
  fr: {
    p1: 'Chemise de week-end en lin', p2: 'Grand sac en cuir du quotidien', p3: 'Baskets classiques', p4: 'Trousse de soins essentiels', p5: 'Cardigan tricoté doux', p6: 'Créoles dorées minimalistes', p7: 'Panier tressé de marché', p8: 'Service à café en grès', p9: 'Chaussures de marche quotidiennes', p10: 'Duo soin corps agrumes', p11: 'T-shirt coton décontracté', p12: 'Pantalon quotidien ajusté', p13: 'Baskets à enfiler en toile', p14: 'Mocassins de week-end en cuir', p15: 'Sac bandoulière du jour', p16: 'Sac à dos toile quotidien', p17: 'Plaid texturé', p18: 'Vase de table en céramique', p19: 'Sérum hydratant quotidien', p20: 'Crème mains botanique', p21: 'Chemise Oxford classique', p22: 'T-shirt col rond coton', p23: 'Pull léger en maille', p24: 'Jean décontracté', p25: 'Robe d’été légère', p26: 'Veste soft en laine', p27: 'Baskets de course rétro', p28: 'Baskets de ville moutarde', p29: 'Baskets marche légères', p30: 'Chaussons confort maison', p31: 'Bottes citadines en cuir', p32: 'Escarpins classiques', p33: 'Sac épaule cuir souple', p34: 'Petite pochette zippée', p35: 'Sac de voyage week-end', p36: 'Portefeuille quotidien', p37: 'Cabas de marché', p38: 'Sac à dos campus spacieux', p39: 'Vase céramique artisanal', p40: 'Duo de vases colorés', p41: 'Vase floral en céramique', p42: 'Plateau en bois minimaliste', p43: 'Service poterie motifé', p44: 'Vase porcelaine fleurie', p45: 'Arrosoir fini à la main', p46: 'Nettoyant visage doux', p47: 'Lotion corporelle nourrissante', p48: 'Kit maquillage éclat doux', p49: 'Huile quotidienne pour cheveux', p50: 'Trousse soin botanique',
  },
  rw: {
    p1: 'Ishati yoroshye yo mu mpera z’icyumweru', p2: 'Umufuka munini w’urukoba wa buri munsi', p3: 'Inkweto zisanzwe z’imikino', p4: 'Agasanduku k’ubwiza bw’ibanze', p5: 'Ikoti ya kanzu yoroheje', p6: 'Impeta z’izahabu zoroheje', p7: 'Agaseke gato k’isoko', p8: 'Igikoresho cya kawa cya kera', p9: 'Inkweto zo kugenda buri munsi', p10: 'Amavuta yo kwisiga y’ibimera bya citrus', p11: 'T-shati y’ipamba yoroheje', p12: 'Ipantalo nziza zo mu buzima bwa buri munsi', p13: 'Inkweto za canvas zo kwambara byoroshye', p14: 'Inkweto za leather zo mu mpera z’icyumweru', p15: 'Umufuka wo ku rutugu wa buri munsi', p16: 'Umufuka wa canvas wa buri munsi', p17: 'Igitambaro cyoroshye cy’igikoni', p18: 'Icyombo cy’ikibaho cya ceramic', p19: 'Serumu y’amazi ya buri munsi', p20: 'Amavuta yo mu ntoki y’ibimera', p21: 'Ishati ya Oxford isanzwe', p22: 'T-shati ya cotton y’isanzwe', p23: 'Sweater yoroshye y’akanyamagana', p24: 'Jean yoroheje ya buri munsi', p25: 'Ikanzu y’urugendo mu cyumweru', p26: 'Ikoti yoroshye y’ubwoya', p27: 'Inkweto za retro running', p28: 'Inkweto z’umuhondo z’umuhanda', p29: 'Inkweto zoroheje zo kugenda', p30: 'Inkweto zo mu rugo zoroshye', p31: 'Ikweto y’umwambaro wa leather', p32: 'Inkweto za heels zo mu buryo', p33: 'Umufuka w’urukoba woroshye', p34: 'Agasanduku gato k’izip', p35: 'Umufuka wo mu rugendo w’icyumweru', p36: 'Umufuka wa carte wa buri munsi', p37: 'Umufuka munini w’isoko', p38: 'Umufuka munini wa campus', p39: 'Icyombo cya ceramic cyakozwe n’intoki', p40: 'Ibikoresho bibiri bya vaze byo mu bikoni', p41: 'Icyombo cya ceramic gifite indabyo', p42: 'Ikibaho cy’ibiti cyoroheje', p43: 'Igikoresho cya ceramic gifite ibishushanyo', p44: 'Icyombo cya porcelaine gifite indabyo', p45: 'Igikoresho cyo kuhira cyakozwe n’intoki', p46: 'Isukura yoroheje y’uruhu', p47: 'Amavuta yo mu mubiri agabanya ubukonje', p48: 'Agasanduku k’ivoto yoroheje', p49: 'Amavuta ya buri munsi yo mu misatsi', p50: 'Igikoresho cy’ubwiza cy’ibimera',
  },
};

export function StoreProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [authState, setAuthState] = useState({ initialized: false, token: null });
  const [authLoadError, setAuthLoadError] = useState('');
  const [accountState, setAccountState] = useState({
    uid: null,
    profile: null,
    orders: [],
    status: 'idle',
    error: '',
  });
  const [language, setLanguage] = useState('en');
  const [productsLoading, setProductsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const accountMatches = Boolean(
    authState.token
    && accountState.uid
    && accountState.profile?.uid === accountState.uid,
  );
  const user = accountMatches ? accountState.profile : null;
  const orders = accountMatches ? accountState.orders : EMPTY_ORDERS;
  const ordersLoading = Boolean(
    authState.token && ['idle', 'loading'].includes(accountState.status),
  );
  const storeError = authLoadError || (accountState.status === 'error'
    ? accountState.error
    : catalogError);

  useEffect(() => {
    AsyncStorage.getItem('dg.language').then((savedLanguage) => {
      if (['en', 'fr', 'rw'].includes(savedLanguage)) setLanguage(savedLanguage);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    getStoredAccessToken().then((token) => {
      if (active) setAuthState({ initialized: true, token });
    }).catch((error) => {
      if (!active) return;
      setAuthLoadError(error.message || 'Could not read the saved sign-in session.');
      setAuthState({ initialized: true, token: null });
    });
    return () => {
      active = false;
    };
  }, []);

  const changeLanguage = useCallback((nextLanguage) => {
    setLanguage(nextLanguage);
    AsyncStorage.setItem('dg.language', nextLanguage).catch(() => {});
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!authState.token) throw new Error('Sign in to continue.');
    return authState.token;
  }, [authState.token]);

  useEffect(() => {
    let active = true;
    getProducts().then((nextProducts) => {
      if (!Array.isArray(nextProducts)) throw new Error('The API returned an invalid product catalog.');
      if (active) setProducts(nextProducts);
    }).catch((error) => {
      if (active) setCatalogError(error.message || 'Could not load products from the shop API.');
    }).finally(() => {
      if (active) setProductsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!authState.initialized) return () => {
      active = false;
    };
    if (!authState.token) return () => {
      active = false;
    };

    (async () => {
      try {
        const token = await getAccessToken();
        const [profile, nextOrders] = await Promise.all([
          getCustomerProfile(token),
          getCustomerOrders(token),
        ]);
        if (!active) return;
        setAccountState({
          uid: profile.uid,
          profile,
          orders: nextOrders,
          status: 'loaded',
          error: '',
        });
      } catch (error) {
        if (active) {
          if (error.status === 401) {
            try {
              await clearStoredAccessToken();
            } catch (storageError) {
              setAuthLoadError(storageError.message || 'Could not clear the expired sign-in session.');
            }
            setAuthState({ initialized: true, token: null });
          }
          setAccountState({
            uid: null,
            profile: null,
            orders: [],
            status: 'error',
            error: error.status === 401
              ? 'Your session expired. Sign in again.'
              : error.message || 'Could not load your account from the shop API.',
          });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authState.initialized, authState.token, getAccessToken]);

  const startLogin = useCallback(async ({ isRegister = false, name, email, password }) => {
    if (!backendConfigured) {
      throw new Error('The Render API is not configured. Check EXPO_PUBLIC_API_URL.');
    }
    const credentials = { email: email.trim().toLowerCase(), password };
    const session = isRegister
      ? await registerAccount({ ...credentials, name: name.trim() })
      : await loginAccount(credentials);
    await storeAccessToken(session.token);
    setAuthLoadError('');
    setAccountState({
      uid: session.user.uid,
      profile: session.user,
      orders: [],
      status: 'loading',
      error: '',
    });
    setAuthState({ initialized: true, token: session.token });
    return session;
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    await requestPasswordReset(email.trim().toLowerCase());
  }, []);

  const finishPasswordReset = useCallback(async (token, password) => {
    await completePasswordReset(token, password);
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredAccessToken();
    setAuthState({ initialized: true, token: null });
    setAccountState({
      uid: null,
      profile: null,
      orders: [],
      status: 'idle',
      error: '',
    });
  }, []);

  const value = useMemo(() => ({
    products,
    cart,
    orders,
    user,
    language,
    authLoading: !authState.initialized || ordersLoading,
    ordersLoading,
    productsLoading,
    backendConfigured,
    authConfigured: backendConfigured,
    storeError,
    t: (key) => COPY[language]?.[key] || COPY.en[key] || key,
    categoryName: (category) => COPY[language]?.[`category${category}`] || COPY.en[`category${category}`] || category,
    statusName: (status) => COPY[language]?.[STATUS_KEYS[status]] || status,
    productName: (productOrId) => {
      const id = typeof productOrId === 'string' ? productOrId : productOrId?.id;
      const fallback = typeof productOrId === 'string' ? productOrId : productOrId?.name;
      return PRODUCT_NAMES[language]?.[id] || fallback || id;
    },
    setLanguage: changeLanguage,
    startLogin,
    sendPasswordReset,
    finishPasswordReset,
    signOut,
    addToCart: (product, quantity = 1) => setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      return found
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...current, { ...product, quantity }];
    }),
    updateQuantity: (id, quantity) => setCart((current) => quantity < 1
      ? current.filter((item) => item.id !== id)
      : current.map((item) => item.id === id ? { ...item, quantity } : item)),
    removeFromCart: (id) => setCart((current) => current.filter((item) => item.id !== id)),
    placeOrder: async (details) => {
      if (!cart.length) throw new Error('Cannot place an order with an empty bag.');
      if (!user?.uid) throw new Error('Sign in before placing an order.');

      const token = await getAccessToken();
      const savedOrder = await createCustomerOrder(token, cart, details);
      setCart([]);
      setAccountState((current) => (current.uid === user.uid
        ? { ...current, orders: [savedOrder, ...current.orders] }
        : current));
      return savedOrder;
    },
    saveDeliveryMessage: async (id, message) => {
      const normalizedMessage = message.trim();
      const order = orders.find((item) => item.id === id);
      if (!order) throw new Error('Cannot save a message for an order that does not exist.');
      if (order.status !== 'Delivered') throw new Error('A delivery message can only be saved after delivery.');
      if (!normalizedMessage) throw new Error('Enter a delivery message before saving.');
      if (!user?.uid) throw new Error('Sign in before saving a delivery message.');
      const token = await getAccessToken();
      const updatedOrder = await saveCustomerDeliveryMessage(token, id, normalizedMessage);
      setAccountState((current) => (current.uid === user.uid
        ? {
          ...current,
          orders: current.orders.map((item) => item.id === id
            ? {
              ...item,
              deliveryMessage: updatedOrder.deliveryMessage,
              deliveryMessageSentAt: updatedOrder.deliveryMessageSentAt,
            }
            : item),
        }
        : current));
    },
  }), [
    products, cart, orders, user, language, authState.initialized,
    ordersLoading, productsLoading, storeError, startLogin, sendPasswordReset, finishPasswordReset,
    signOut, getAccessToken, changeLanguage,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used within StoreProvider');
  return store;
}
