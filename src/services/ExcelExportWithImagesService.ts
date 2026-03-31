// excel-export-with-images.service.ts
import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ChargeSheetComplete } from '../models/charge-sheet.model';


@Injectable({
   providedIn: 'root'
})
export class ExcelExportWithImagesService {

  async exportChargeSheetWithImages(sheet: ChargeSheetComplete, itemsImages: { [key: number]: string }): Promise<void> {
    if (!sheet) {
      alert("Aucune donnée à exporter");
      return;
    }

    const items = sheet.items;
    if (!items || items.length === 0) {
      alert("Aucun item à exporter");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Items');

    // ===== AJOUT DES INFORMATIONS GÉNÉRALES DU CAHIER =====
    // Ligne 1: Titre "Cahier de charge"
    const titleRow = worksheet.addRow(['CAHIER DE CHARGE #' + sheet.id]);
    titleRow.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' }
    };
    titleRow.height = 35;
    worksheet.mergeCells(1, 1, 1, 15);

    // Lignes d'informations générales
    const infoData = [
      ['Plant:', sheet.plant || ''],
      ['Projet:', sheet.project || ''],
      ['Harness Ref:', sheet.harnessRef || ''],
      ['Issued By:', sheet.issuedBy || ''],
      ['Email:', sheet.emailAddress || ''],
      ['Téléphone:', sheet.phoneNumber || ''],
      ['N° Commande:', sheet.orderNumber || ''],
      ['Centre coût:', sheet.costCenterNumber || ''],
      ['Date création:', sheet.date ? new Date(sheet.date).toLocaleDateString('fr-FR') : ''],
      ['Date livraison:', sheet.preferredDeliveryDate ? new Date(sheet.preferredDeliveryDate).toLocaleDateString('fr-FR') : ''],
      ['Statut:', this.getStatusLabel(sheet.status) || '']
    ];

    infoData.forEach(([label, value]) => {
      const row = worksheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      row.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }
      };
      row.height = 20;
    });

    worksheet.addRow([]);

    // ===== DÉFINITION DES COLONNES =====
    const generalCols = [
      { key: 'id', width: 8 },
      { key: 'itemNumber', width: 8 },
      { key: 'samplesExist', width: 8 },
      { key: 'ways', width: 6 },
      { key: 'housingColour', width: 10 },
      { key: 'testModuleExistInDatabase', width: 10 },
      { key: 'housingReferenceLeoni', width: 15 },
      { key: 'housingReferenceSupplierCustomer', width: 15 },
      { key: 'referenceSealsClipsCableTiesCap', width: 12 },
      { key: 'photo', width: 12 },
      { key: 'quantityOfTestModules', width: 8 },
      { key: 'outsideHousingExist', width: 8 },
      { key: 'insideHousingExist', width: 8 },
      { key: 'coverHoodExist', width: 8 },
      { key: 'coverHoodClosed', width: 10 },
      { key: 'capExist', width: 6 },
      { key: 'bayonetCapExist', width: 8 },
      { key: 'bracketExist', width: 8 },
      { key: 'bracketOpen', width: 10 },
      { key: 'bracketClosed', width: 10 },
      { key: 'latchWingExist', width: 8 },
      { key: 'sliderExist', width: 8 },
      { key: 'sliderOpen', width: 10 },
      { key: 'sliderClosed', width: 10 },
      { key: 'secondaryLockExist', width: 8 },
      { key: 'secondaryLockOpen', width: 10 },
      { key: 'secondaryLockClosed', width: 12 },
      { key: 'offsetTest', width: 8 },
      { key: 'pushBackTest', width: 8 },
      { key: 'terminalOrientation', width: 10 },
      { key: 'terminalDifferentiation', width: 10 },
      { key: 'ringTerminal', width: 8 },
      { key: 'singleContact', width: 10 },
      { key: 'heatShrinkExist', width: 8 },
      { key: 'openShuntsAirbag', width: 8 },
      { key: 'flowTest', width: 8 },
      { key: 'solidMetalContour', width: 8 },
      { key: 'metalContourAdjustable', width: 8 },
      { key: 'metalRailsFasteningSystem', width: 10 },
      { key: 'metalPlatesFasteningSystem', width: 10 },
      { key: 'spacerClosingUnit', width: 8 },
      { key: 'spring', width: 8 },
      { key: 'cableTieExist', width: 8 },
      { key: 'cableTieLeft', width: 8 },
      { key: 'cableTieRight', width: 8 },
      { key: 'cableTieMiddle', width: 8 },
      { key: 'cableTieLeftRight', width: 8 },
      { key: 'clipExist', width: 6 },
      { key: 'screwExist', width: 6 },
      { key: 'nutExist', width: 6 },
      { key: 'convolutedConduitExist', width: 8 },
      { key: 'convolutedConduitClosed', width: 10 },
      { key: 'cableChannelExist', width: 8 },
      { key: 'cableChannelClosed', width: 10 },
      { key: 'grommetExist', width: 8 },
      { key: 'grommetOrientation', width: 12 },
      { key: 'presenceTestOfOneSideConnectedShield', width: 12 },
      { key: 'antennaOnlyPresenceTest', width: 10 },
      { key: 'antennaOnlyContactingOfShield', width: 12 },
      { key: 'antennaContactingOfShieldAndCoreWire', width: 12 },
      { key: 'otherDetection', width: 10 },
      { key: 'mechanicalCoding', width: 10 },
      { key: 'electricalCoding', width: 10 },
      { key: 'airbagTestViaServiceWindow', width: 8 },
      { key: 'leakTestPressure', width: 8 },
      { key: 'leakTestVacuum', width: 8 },
      { key: 'leakTestComplex', width: 10 },
      { key: 'pinStraightnessCheck', width: 10 },
      { key: 'contrastDetectionGreyValueSensor', width: 8 },
      { key: 'colourDetection', width: 10 },
      { key: 'colourDetectionPrepared', width: 10 },
      { key: 'attenuationWithModeScrambler', width: 8 },
      { key: 'attenuationWithoutModeScrambler', width: 10 },
      { key: 'insulationResistance', width: 8 },
      { key: 'highVoltageModule', width: 8 },
      { key: 'kelvinMeasurementHV', width: 8 },
      { key: 'actuatorTestHV', width: 8 },
      { key: 'chargingSystemElectrical', width: 10 },
      { key: 'ptuPipeTestUnit', width: 5 },
      { key: 'gtuGrommetTestUnit', width: 5 },
      { key: 'ledLEDTestModule', width: 5 },
      { key: 'tigTerminalInsertionGuidance', width: 5 },
      { key: 'linBusFunctionalityTest', width: 5 },
      { key: 'canBusFunctionalityTest', width: 5 },
      { key: 'esdConformModule', width: 5 },
      { key: 'fixedBlock', width: 8 },
      { key: 'movingBlock', width: 8 },
      { key: 'tiltModule', width: 5 },
      { key: 'slideModule', width: 5 },
      { key: 'handAdapter', width: 10 },
      { key: 'lsmLeoniSmartModule', width: 5 },
      { key: 'leoniStandardTestTable', width: 8 },
      { key: 'quickConnectionByCanonConnector', width: 10 },
      { key: 'testBoard', width: 8 },
      { key: 'weetech', width: 8 },
      { key: 'bak', width: 5 },
      { key: 'ogc', width: 5 },
      { key: 'adaptronicHighVoltage', width: 8 },
      { key: 'emdepHVBananaPlug', width: 8 },
      { key: 'leoniEMOStandardHV', width: 10 },
      { key: 'clipOrientation', width: 10 },
      { key: 'unitPrice', width: 12 },
      { key: 'totalPrice', width: 12 }
    ];

    worksheet.columns = generalCols;

    const lastRow = worksheet.lastRow;
    if (!lastRow) return;

    const headerRowNumber = lastRow.number + 1;

    // Groupes
    const generalStart = 1, generalEnd = 11;
    const housingStart = 12, housingEnd = 27;
    const fasteningStart = 28, fasteningEnd = 42;
    const cableStart = 43, cableEnd = 61;
    const electricalStart = 62, electricalEnd = 101;
    const priceStart = 102, priceEnd = 103;

    const headerRow = worksheet.addRow([]);
    headerRow.getCell(generalStart).value = 'Général';
    worksheet.mergeCells(headerRowNumber, generalStart, headerRowNumber, generalEnd);
    headerRow.getCell(housingStart).value = 'Housing Tests';
    worksheet.mergeCells(headerRowNumber, housingStart, headerRowNumber, housingEnd);
    headerRow.getCell(fasteningStart).value = 'Fastening / Assembly';
    worksheet.mergeCells(headerRowNumber, fasteningStart, headerRowNumber, fasteningEnd);
    headerRow.getCell(cableStart).value = 'Cable / Conduit';
    worksheet.mergeCells(headerRowNumber, cableStart, headerRowNumber, cableEnd);
    headerRow.getCell(electricalStart).value = 'Electrical / Tests';
    worksheet.mergeCells(headerRowNumber, electricalStart, headerRowNumber, electricalEnd);
    headerRow.getCell(priceStart).value = 'Prix';
    worksheet.mergeCells(headerRowNumber, priceStart, headerRowNumber, priceEnd);

    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4E73DF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Sous-en-têtes
    const subHeaderRow = worksheet.addRow([
      'ID', 'Item', 'Échant.', 'Voies', 'Couleur', 'Module DB', 'Réf. Leoni', 'Réf. client', 'Réf. joints', 'Photo', 'Quantité',
      'Outside', 'Inside', 'Cover', 'Cover Closed', 'Cap', 'Bayonet', 'Bracket', 'Bracket Open', 'Bracket Closed', 'Latch', 'Slider', 'Slider Open', 'Slider Closed', 'Sec Lock', 'Sec Lock Open', 'Sec Lock Closed',
      'Offset', 'PushBack', 'Term Orient', 'Term Diff', 'Ring Term', 'Single Contact', 'HeatShrink', 'OpenShunts', 'FlowTest', 'SolidMetal', 'MetalAdj', 'MetalRails', 'MetalPlates', 'Spacer', 'Spring',
      'CableTie', 'Tie Left', 'Tie Right', 'Tie Middle', 'Tie L/R', 'Clip', 'Screw', 'Nut', 'Conduit', 'Conduit Closed', 'Channel', 'Channel Closed', 'Grommet', 'Grommet Orient', 'OneSideShield', 'AntennaPres', 'AntennaShield', 'AntennaCore', 'OtherDetect',
      'MechCoding', 'ElecCoding', 'Airbag', 'LeakPress', 'LeakVac', 'LeakComplex', 'PinStraight', 'Contrast', 'ColourDetect', 'ColourPrep', 'AttenWith', 'AttenWithout', 'Insulation', 'HVModule', 'KelvinHV', 'ActuatorHV', 'ChargingSys', 'PTU', 'GTU', 'LED', 'TIG', 'LIN', 'CAN', 'ESD', 'FixedBlock', 'MovingBlock', 'Tilt', 'Slide', 'HandAdapter', 'LSM', 'LeoniStd', 'QuickConn', 'TestBoard', 'WEETECH', 'BAK', 'OGC', 'Adaptronic', 'EMDEP', 'LEONI EMO', 'ClipOrient',
      'Prix unitaire', 'Prix total'
    ]);

    subHeaderRow.font = { bold: true };
    subHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FC' } };
    subHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    subHeaderRow.height = 30;

    // Traitement des données
    const itemsLength = items.length;
    const dataStartRow = subHeaderRow.number + 1;

    for (let i = 0; i < itemsLength; i++) {
      const item = items[i];
      const rowIndex = dataStartRow + i;

      const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (value === '*') return '✓';
        if (value === '') return '✗';
        if (typeof value === 'boolean') return value ? '✓' : '✗';
        if (value === 'Yes') return 'Oui';
        if (value === 'No') return 'Non';
        return String(value);
      };

      const rowData: any = {};

      // Général
      rowData.id = item.id;
      rowData.itemNumber = item.itemNumber ? '#' + item.itemNumber : '';
      rowData.samplesExist = item.samplesExist === 'Yes' ? 'Oui' : 'Non';
      rowData.ways = item.ways || '';
      rowData.housingColour = item.housingColour || '';
      rowData.testModuleExistInDatabase = item.testModuleExistInDatabase === 'Yes' ? 'Oui' : 'Non';
      rowData.housingReferenceLeoni = item.housingReferenceLeoni || '';
      rowData.housingReferenceSupplierCustomer = item.housingReferenceSupplierCustomer || '';
      rowData.referenceSealsClipsCableTiesCap = item.referenceSealsClipsCableTiesCap || '';
      rowData.photo = '';
      rowData.quantityOfTestModules = item.quantityOfTestModules || 0;

      // Housing
      rowData.outsideHousingExist = formatValue(item.outsideHousingExist);
      rowData.insideHousingExist = formatValue(item.insideHousingExist);
      rowData.coverHoodExist = formatValue(item.coverHoodExist);
      rowData.coverHoodClosed = formatValue(item.coverHoodClosed);
      rowData.capExist = formatValue(item.capExist);
      rowData.bayonetCapExist = formatValue(item.bayonetCapExist);
      rowData.bracketExist = formatValue(item.bracketExist);
      rowData.bracketOpen = formatValue(item.bracketOpen);
      rowData.bracketClosed = formatValue(item.bracketClosed);
      rowData.latchWingExist = formatValue(item.latchWingExist);
      rowData.sliderExist = formatValue(item.sliderExist);
      rowData.sliderOpen = formatValue(item.sliderOpen);
      rowData.sliderClosed = formatValue(item.sliderClosed);
      rowData.secondaryLockExist = formatValue(item.secondaryLockExist);
      rowData.secondaryLockOpen = formatValue(item.secondaryLockOpen);
      rowData.secondaryLockClosed = formatValue(item.secondaryLockClosed);

      // Fastening
      rowData.offsetTest = formatValue(item.offsetTest);
      rowData.pushBackTest = formatValue(item.pushBackTest);
      rowData.terminalOrientation = formatValue(item.terminalOrientation);
      rowData.terminalDifferentiation = formatValue(item.terminalDifferentiation);
      rowData.ringTerminal = formatValue(item.ringTerminal);
      rowData.singleContact = formatValue(item.singleContact);
      rowData.heatShrinkExist = formatValue(item.heatShrinkExist);
      rowData.openShuntsAirbag = formatValue(item.openShuntsAirbag);
      rowData.flowTest = formatValue(item.flowTest);
      rowData.solidMetalContour = formatValue(item.solidMetalContour);
      rowData.metalContourAdjustable = formatValue(item.metalContourAdjustable);
      rowData.metalRailsFasteningSystem = formatValue(item.metalRailsFasteningSystem);
      rowData.metalPlatesFasteningSystem = formatValue(item.metalPlatesFasteningSystem);
      rowData.spacerClosingUnit = formatValue(item.spacerClosingUnit);
      rowData.spring = formatValue(item.spring);

      // Cable
      rowData.cableTieExist = formatValue(item.cableTieExist);
      rowData.cableTieLeft = formatValue(item.cableTieLeft);
      rowData.cableTieRight = formatValue(item.cableTieRight);
      rowData.cableTieMiddle = formatValue(item.cableTieMiddle);
      rowData.cableTieLeftRight = formatValue(item.cableTieLeftRight);
      rowData.clipExist = formatValue(item.clipExist);
      rowData.screwExist = formatValue(item.screwExist);
      rowData.nutExist = formatValue(item.nutExist);
      rowData.convolutedConduitExist = formatValue(item.convolutedConduitExist);
      rowData.convolutedConduitClosed = formatValue(item.convolutedConduitClosed);
      rowData.cableChannelExist = formatValue(item.cableChannelExist);
      rowData.cableChannelClosed = formatValue(item.cableChannelClosed);
      rowData.grommetExist = formatValue(item.grommetExist);
      rowData.grommetOrientation = item.grommetOrientation || '';
      rowData.presenceTestOfOneSideConnectedShield = formatValue(item.presenceTestOfOneSideConnectedShield);
      rowData.antennaOnlyPresenceTest = formatValue(item.antennaOnlyPresenceTest);
      rowData.antennaOnlyContactingOfShield = formatValue(item.antennaOnlyContactingOfShield);
      rowData.antennaContactingOfShieldAndCoreWire = formatValue(item.antennaContactingOfShieldAndCoreWire);
      rowData.otherDetection = formatValue(item.otherDetection);

      // Electrical
      rowData.mechanicalCoding = formatValue(item.mechanicalCoding);
      rowData.electricalCoding = formatValue(item.electricalCoding);
      rowData.airbagTestViaServiceWindow = formatValue(item.airbagTestViaServiceWindow);
      rowData.leakTestPressure = formatValue(item.leakTestPressure);
      rowData.leakTestVacuum = formatValue(item.leakTestVacuum);
      rowData.leakTestComplex = formatValue(item.leakTestComplex);
      rowData.pinStraightnessCheck = formatValue(item.pinStraightnessCheck);
      rowData.contrastDetectionGreyValueSensor = formatValue(item.contrastDetectionGreyValueSensor);
      rowData.colourDetection = formatValue(item.colourDetection);
      rowData.colourDetectionPrepared = formatValue(item.colourDetectionPrepared);
      rowData.attenuationWithModeScrambler = formatValue(item.attenuationWithModeScrambler);
      rowData.attenuationWithoutModeScrambler = formatValue(item.attenuationWithoutModeScrambler);
      rowData.insulationResistance = formatValue(item.insulationResistance);
      rowData.highVoltageModule = formatValue(item.highVoltageModule);
      rowData.kelvinMeasurementHV = formatValue(item.kelvinMeasurementHV);
      rowData.actuatorTestHV = formatValue(item.actuatorTestHV);
      rowData.chargingSystemElectrical = formatValue(item.chargingSystemElectrical);
      rowData.ptuPipeTestUnit = formatValue(item.ptuPipeTestUnit);
      rowData.gtuGrommetTestUnit = formatValue(item.gtuGrommetTestUnit);
      rowData.ledLEDTestModule = formatValue(item.ledLEDTestModule);
      rowData.tigTerminalInsertionGuidance = formatValue(item.tigTerminalInsertionGuidance);
      rowData.linBusFunctionalityTest = formatValue(item.linBusFunctionalityTest);
      rowData.canBusFunctionalityTest = formatValue(item.canBusFunctionalityTest);
      rowData.esdConformModule = formatValue(item.esdConformModule);
      rowData.fixedBlock = formatValue(item.fixedBlock);
      rowData.movingBlock = formatValue(item.movingBlock);
      rowData.tiltModule = formatValue(item.tiltModule);
      rowData.slideModule = formatValue(item.slideModule);
      rowData.handAdapter = formatValue(item.handAdapter);
      rowData.lsmLeoniSmartModule = formatValue(item.lsmLeoniSmartModule);
      rowData.leoniStandardTestTable = formatValue(item.leoniStandardTestTable);
      rowData.quickConnectionByCanonConnector = formatValue(item.quickConnectionByCanonConnector);
      rowData.testBoard = item.testBoard || '';
      rowData.weetech = formatValue(item.weetech);
      rowData.bak = formatValue(item.bak);
      rowData.ogc = formatValue(item.ogc);
      rowData.adaptronicHighVoltage = formatValue(item.adaptronicHighVoltage);
      rowData.emdepHVBananaPlug = formatValue(item.emdepHVBananaPlug);
      rowData.leoniEMOStandardHV = formatValue(item.leoniEMOStandardHV);
      rowData.clipOrientation = item.clipOrientation || '';

      // Prix
      rowData.unitPrice = item.unitPrice || 0;
      rowData.totalPrice = item.totalPrice || 0;

      const row = worksheet.addRow(Object.values(rowData));

      // Ajouter l'image si elle existe
      if (item.id && itemsImages && itemsImages[item.id]) {
        try {
          const imageUrl = itemsImages[item.id];
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();

          let extension: 'png' | 'jpeg' | 'gif' = 'png';
          if (imageUrl.includes('jpg') || imageUrl.includes('jpeg')) extension = 'jpeg';
          else if (imageUrl.includes('gif')) extension = 'gif';

          const imageId = workbook.addImage({
            buffer: arrayBuffer,
            extension: extension
          });

          worksheet.addImage(imageId, {
            tl: { col: 9.5, row: rowIndex - 0.8 },
            ext: { width: 80, height: 80 },
            editAs: 'oneCell'
          });
        } catch (error) {
          console.error(`Erreur chargement image pour item ${item.id}:`, error);
        }
      }
    }

    // Styliser les lignes
    for (let i = dataStartRow; i < dataStartRow + itemsLength; i++) {
      const row = worksheet.getRow(i);
      row.height = 80;
      if ((i - dataStartRow) % 2 === 0) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFBFBFD' }
          };
        });
      }
    }

    const getColumnLetter = (index: number): string => {
      let letter = '';
      while (index > 0) {
        const mod = (index - 1) % 26;
        letter = String.fromCharCode(65 + mod) + letter;
        index = Math.floor((index - 1) / 26);
      }
      return letter;
    };

    const addGroupBorder = (colLetter: string) => {
      for (let i = headerRowNumber; i < dataStartRow + itemsLength; i++) {
        const cell = worksheet.getCell(`${colLetter}${i}`);
        cell.border = {
          left: { style: 'medium', color: { argb: 'FF4E73DF' } }
        };
      }
    };

    addGroupBorder(getColumnLetter(generalEnd + 1));
    addGroupBorder(getColumnLetter(housingEnd + 1));
    addGroupBorder(getColumnLetter(fasteningEnd + 1));
    addGroupBorder(getColumnLetter(cableEnd + 1));
    addGroupBorder(getColumnLetter(electricalEnd + 1));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `ChargeSheet_${sheet.id}_Items.xlsx`);
  }

  private getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'DRAFT': 'Brouillon',
      'VALIDATED_ING': 'Validé ING',
      'TECH_FILLED': 'Rempli Technique',
      'VALIDATED_PT': 'Validé PT',
      'SENT_TO_SUPPLIER': 'Envoyé Fournisseur',
      'RECEIVED_FROM_SUPPLIER': 'Reçu Fournisseur',
      'COMPLETED': 'Terminé'
    };
    return labels[status] || status;
  }
}