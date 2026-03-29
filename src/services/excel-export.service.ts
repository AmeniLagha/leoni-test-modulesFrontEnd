import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';


@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  /**
   * Exporte un cahier des charges complet en fichier Excel
   * @param chargeSheet - L'objet cahier des charges complet
   * @param filename - Nom du fichier (optionnel)
   */
  exportChargeSheetToExcel(chargeSheet: any, filename?: string): void {
    if (!chargeSheet) {
      console.error('Aucune donnée à exporter');
      return;
    }

    // Préparer les données pour l'export
    const worksheetData = this.prepareChargeSheetData(chargeSheet);

    // Créer un classeur
    const workbook = XLSX.utils.book_new();

    // Créer une feuille de calcul
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Ajuster la largeur des colonnes
    const maxWidth = 50;
    worksheet['!cols'] = [
      { wch: 30 }, // Colonne A (Clé)
      { wch: 50 }  // Colonne B (Valeur)
    ];

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cahier des Charges');

    // Générer le nom du fichier
    const fileName = filename || `cahier_charge_${chargeSheet.id}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Exporter
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Prépare les données du cahier des charges pour l'export
   */
  private prepareChargeSheetData(chargeSheet: any): any[][] {
    const data: any[][] = [];

    // En-tête du document
    data.push(['CAHIER DES CHARGES', `ID: ${chargeSheet.id}`]);
    data.push(['Date export', new Date().toLocaleString('fr-FR')]);
    data.push([]); // Ligne vide

    // === SECTION 1: INFORMATIONS GÉNÉRALES ===
    data.push(['=== INFORMATIONS GÉNÉRALES ===', '']);

    const generalFields = [
      ['Statut', chargeSheet.status],
      ['Créé par', chargeSheet.createdBy],
      ['Date création', chargeSheet.createdAt],
      ['Modifié par', chargeSheet.updatedBy],
      ['Date modification', chargeSheet.updatedAt]
    ];

    generalFields.forEach(field => {
      if (field[1] !== undefined && field[1] !== null) {
        data.push([field[0], field[1]]);
      }
    });

    data.push([]); // Ligne vide

    // === SECTION 2: INFORMATIONS DE BASE (ING) ===
    if (chargeSheet.basic) {
      data.push(['=== INFORMATIONS DE BASE (ING) ===', '']);

      // Aplatir l'objet basic
      Object.entries(chargeSheet.basic).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Formater le nom du champ
          const formattedKey = this.formatFieldName(key);
          data.push([formattedKey, value]);
        }
      });

      data.push([]); // Ligne vide
    }

    // === SECTION 3: INFORMATIONS TECHNIQUES (PT) ===
    if (chargeSheet.tech) {
      data.push(['=== INFORMATIONS TECHNIQUES (PT) ===', '']);

      // Aplatir l'objet tech
      Object.entries(chargeSheet.tech).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Formater le nom du champ
          const formattedKey = this.formatFieldName(key);

          // Pour les champs booléens, afficher "Oui" si "*", "Non" si vide
          let displayValue = value;
          if (value === '*') {
            displayValue = 'Oui (*)';
          } else if (value === '') {
            displayValue = 'Non (-)';
          }

          data.push([formattedKey, displayValue]);
        }
      });

      data.push([]); // Ligne vide
    }

    // === SECTION 4: INFORMATIONS COMPLÉMENTAIRES ===
    data.push(['=== INFORMATIONS COMPLÉMENTAIRES ===', '']);

    const otherFields = [
      ['Plant', chargeSheet.plant],
      ['Projet', chargeSheet.project],
      ['Référence Harness', chargeSheet.harnessRef],
      ['Émis par', chargeSheet.issuedBy],
      ['Email', chargeSheet.emailAddress],
      ['Téléphone', chargeSheet.phoneNumber],
      ['Numéro commande', chargeSheet.orderNumber],
      ['Centre de coût', chargeSheet.costCenterNumber],
      ['Date', chargeSheet.date],
      ['Date livraison souhaitée', chargeSheet.preferredDeliveryDate],
      ['Numéro item', chargeSheet.itemNumber],
      ['Échantillons existants', chargeSheet.samplesExist],
      ['Nombre de voies', chargeSheet.ways],
      ['Couleur boîtier', chargeSheet.housingColour],
      ['Module test en base', chargeSheet.testModuleExistInDatabase],
      ['Référence Leoni', chargeSheet.housingReferenceLeoni],
      ['Référence client', chargeSheet.housingReferenceSupplierCustomer],
      ['Réf. joints/clips', chargeSheet.referenceSealsClipsCableTiesCap],
      ['Photo connecteur', chargeSheet.realConnectorPicture],
      ['Quantité modules test', chargeSheet.quantityOfTestModules]
    ];

    otherFields.forEach(([label, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        data.push([label, value]);
      }
    });

    return data;
  }

  /**
   * Formate un nom de champ (camelCase → Texte lisible)
   */
  private formatFieldName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace('Exist', ' Existe')
      .replace('Exist', ' Existe')
      .replace('Coding', ' Codage')
      .replace('Test', ' Test')
      .replace('Pressure', ' Pression')
      .replace('Vacuum', ' Vide')
      .replace('Leak', ' Fuite')
      .replace('Cable', ' Câble')
      .replace('Tie', ' Attache')
      .replace('Clip', ' Clip')
      .replace('Screw', ' Vis')
      .replace('Nut', ' Écrou')
      .replace('Orientation', ' Orientation')
      .replace('Detection', ' Détection')
      .replace('Resistance', ' Résistance')
      .replace('Voltage', ' Tension')
      .replace('Actuator', ' Actionneur')
      .replace('Charging', ' Charge')
      .replace('Electrical', ' Électrique')
      .replace('Mechanical', ' Mécanique');
  }

  /**
   * Exporte une liste de cahiers des charges (format tableau)
   */
  exportMultipleChargeSheets(chargeSheets: any[], filename?: string): void {
    if (!chargeSheets || chargeSheets.length === 0) {
      console.error('Aucune donnée à exporter');
      return;
    }

    // Créer les en-têtes
    const headers = [
      'ID', 'Statut', 'Plant', 'Projet', 'Harness Ref', 'Émis par',
      'Email', 'Téléphone', 'Numéro commande', 'Centre de coût',
      'Date', 'Date livraison', 'Item', 'Voies', 'Couleur',
      'Réf. Leoni', 'Réf. client', 'Quantité'
    ];

    // Préparer les données
    const rows = chargeSheets.map(sheet => [
      sheet.id,
      sheet.status,
      sheet.plant || '',
      sheet.project || '',
      sheet.harnessRef || '',
      sheet.issuedBy || '',
      sheet.emailAddress || '',
      sheet.phoneNumber || '',
      sheet.orderNumber || '',
      sheet.costCenterNumber || '',
      sheet.date || '',
      sheet.preferredDeliveryDate || '',
      sheet.itemNumber || '',
      sheet.ways || '',
      sheet.housingColour || '',
      sheet.housingReferenceLeoni || '',
      sheet.housingReferenceSupplierCustomer || '',
      sheet.quantityOfTestModules || ''
    ]);

    // Créer le tableau de données
    const data = [headers, ...rows];

    // Créer le classeur
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Ajuster la largeur des colonnes
    worksheet['!cols'] = headers.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cahiers des charges');

    const fileName = filename || `cahiers_charges_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
