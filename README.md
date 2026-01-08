# SITARCA (beta) : Identity Security Posture Management (ISPM)

<table style="width: 100%; border-collapse: collapse; border: 0px solid #ddd;">
  <thead>
    <tr style="background-color: #f8f9fa;">
      <th rowspan="2" style="padding: 8px;">
      <img src="https://github.com/OurITRes/.github/blob/main/sitarca.svg" width="60" height="60"
      alt="">
      </th>
    </tr>
    <tr style="background-color: #f8f9fa;">
      <th style="padding: 8px;"><span style="font-weight: 600; color: #2C3E50; letter-spacing: 0.1em; ">
      Synchronized Intelligence, Tiered Automated Remediation &amp; Conformity Alignment</th>
    </tr>
  </thead>
</table>

<table style="width: 100%; border-collapse: collapse; border: 0px solid #ddd;">
  <thead>
    <tr>
      <th style="padding: 8px;"> <span>HEX</span> <span>#4169E1</span> </th>
    </tr>
  </thead>
</table>

La "**Pierre de Rosette**" de la **sécurité des identités**.
_Link vulnerabilities tools to Control Frameworks.
Identify gaps and plan remediation with a data-driven model._

## 📖 Vision du Projet

Sitarca est une plateforme de **Normalisation et de Gouvernance** dédiée à la sécurité de
l'Active Directory et des Identités.

Là où les outils existants (PingCastle, Bloodhound) fournissent des listes techniques de problèmes ou de
chemins d'attaque, Sitarca :

1. **Centralise** ces données hétérogènes.
2. **Normalise** l'information dans un format universel ("Sitarca Vulnerability Format").
3. **Traduit** techniquement ces failles en impacts de conformité (NIST, ISO, CIS).
4. **Priorise** la remédiation basée sur la réduction réelle du risque (Gap Analysis).

## 🏗 Architecture

Le projet suit une architecture stricte en trois couches pour garantir la séparation des responsabilités :

- 📂 /data : La source de vérité. Contient les schémas JSON (la "Pierre de Rosette"), les référentiels de
  contrôle (Frameworks) et les règles de traduction.
- ⚙️ /backend : Le moteur intelligent. Gère l'ingestion (ETL), le mapping automatique et l'API.
- 🖥️ /frontend : L'interface utilisateur. Tableaux de bord de conformité et plans de remédiation
  interactifs.

## 🔌 Intégrations (V1)

Cette version se concentre exclusivement sur la posture de sécurité de l'identité :

- **PingCastle** (Hygiène AD & Mauvaises configurations)
- **Bloodhound Enterprise** (Chemins d'attaque & Graphes de relations)

## 🚀 Démarrage Rapide

_Note : Instructions de développement à venir une fois le squelette initialisé._

### Pré-requis

- Python 3.10+ (Backend)
- Node.js 18+ (Frontend)

## 🗺 Roadmap

- [ ] Phase 1 : Data Model - Définition du format universel JSON.
- [ ] Phase 2 : Ingestion - Parsers pour XML PingCastle et JSON Bloodhound.
- [ ] Phase 3 : Engine - Moteur de mapping vers NIST CSF 2.0.
- [ ] Phase 4 : UI - Dashboard de conformité et Gap Analysis.

Ce projet est actuellement en cours de refonte majeure.
Les anciennes versions et POCs ont été archivés.
