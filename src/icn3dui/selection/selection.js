/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

iCn3DUI.prototype.clickShow_selected = function() { var me = this;
    $("#" + me.pre + "show_selected").add("#" + me.pre + "mn2_show_selected").click(function(e) {
       //me.setLogCmd("show selection", true);

       me.showSelection();
       me.setLogCmd("show selection", true);
    });
};

iCn3DUI.prototype.showSelection = function (id) { var me = this;
    me.icn3d.dAtoms = {};

    me.icn3d.dAtoms = me.icn3d.cloneHash(me.icn3d.hAtoms);

    var centerAtomsResults = me.icn3d.centerAtoms(me.icn3d.hash2Atoms(me.icn3d.dAtoms));
    me.icn3d.maxD = centerAtomsResults.maxD;
    if (me.icn3d.maxD < 5) me.icn3d.maxD = 5;

    //show selected rotationcenter
    me.icn3d.opts['rotationcenter'] = 'display center';
    me.icn3d.opts['hbonds'] = 'no';
    me.icn3d.opts['ssbonds'] = 'no';

    me.icn3d.lines['hbond'] = [];
    me.icn3d.lines['ssbond'] = [];

    me.saveSelectionIfSelected();

    me.icn3d.draw();

    me.update2DdgmContent();
    me.updateHl2D();

    // show selected chains in annotation window
    me.showAnnoSelectedChains();
};

iCn3DUI.prototype.clickModeswitch = function() { var me = this;
    $("#" + me.pre + "modeswitch").click(function (e) {
        if($("#" + me.pre + "modeswitch")[0].checked) { // mode: selection
            me.setModeAndDisplay('selection');
        }
        else { // mode: all
            me.setModeAndDisplay('all');
        }
    });

    $("#" + me.pre + "mn6_modeall").click(function (e) {
        me.setModeAndDisplay('all');
    });

    $("#" + me.pre + "mn6_modeselection").click(function (e) {
        me.setModeAndDisplay('selection');
    });
};

iCn3DUI.prototype.selectAll = function() { var me = this;
    me.icn3d.hAtoms = {};

    for(var i in me.icn3d.chains) {
       me.icn3d.hAtoms = me.icn3d.unionHash(me.icn3d.hAtoms, me.icn3d.chains[i]);
       me.icn3d.dAtoms = me.icn3d.unionHash(me.icn3d.dAtoms, me.icn3d.chains[i]);
    }

    me.icn3d.removeHlObjects();
    me.removeHl2D();
    me.removeHlMenus();

    me.bSelectResidue = false;
    me.bSelectAlignResidue = false;

    me.removeSeqResidueBkgd();
    me.update2DdgmContent();

    // show annotations for all protein chains
    $("#" + me.pre + "dl_annotations > .icn3d-annotation").show();

    me.setMode('all');
};

iCn3DUI.prototype.setModeAndDisplay = function(mode) { var me = this;
    if(mode === 'all') { // mode all
        me.setMode('all');

        // remember previous selection
        me.icn3d.prevHighlightAtoms = me.icn3d.cloneHash(me.icn3d.hAtoms);

       // select all
       me.setLogCmd("set mode all", true);

       me.selectAll();

       me.icn3d.draw();
    }
    else { // mode selection
        me.setMode('selection');

        // get the previous hAtoms
        if(me.icn3d.prevHighlightAtoms !== undefined) {
            me.icn3d.hAtoms = me.icn3d.cloneHash(me.icn3d.prevHighlightAtoms);
        }
        else {
            me.selectAll();
        }

        me.setLogCmd("set mode selection", true);

        me.updateHlAll();
    }
};

iCn3DUI.prototype.setMode = function(mode) { var me = this;
    if(mode === 'all') { // mode all
        // set text
        $("#" + me.pre + "modeall").show();
        $("#" + me.pre + "modeselection").hide();

        $("#" + me.pre + "modeswitch")[0].checked = false;

        if($("#" + me.pre + "style").hasClass('icn3d-modeselection')) $("#" + me.pre + "style").removeClass('icn3d-modeselection');
        if($("#" + me.pre + "color").hasClass('icn3d-modeselection')) $("#" + me.pre + "color").removeClass('icn3d-modeselection');
        //if($("#" + me.pre + "surface").hasClass('icn3d-modeselection')) $("#" + me.pre + "surface").removeClass('icn3d-modeselection');
    }
    else { // mode selection
        //if(Object.keys(me.icn3d.hAtoms).length < Object.keys(me.icn3d.atoms).length) {
            // set text
            $("#" + me.pre + "modeall").hide();
            $("#" + me.pre + "modeselection").show();

            $("#" + me.pre + "modeswitch")[0].checked = true;

            if(!$("#" + me.pre + "style").hasClass('icn3d-modeselection')) $("#" + me.pre + "style").addClass('icn3d-modeselection');
            if(!$("#" + me.pre + "color").hasClass('icn3d-modeselection')) $("#" + me.pre + "color").addClass('icn3d-modeselection');
            //if(!$("#" + me.pre + "surface").hasClass('icn3d-modeselection')) $("#" + me.pre + "surface").addClass('icn3d-modeselection');

            // show selected chains in annotation window
            //me.showAnnoSelectedChains();
        //}
    }
};

iCn3DUI.prototype.saveSelection = function(name, description) { var me = this;
    me.selectedResidues = {};

    for(var i in me.icn3d.hAtoms) {
      if(me.icn3d.hAtoms[i] !== undefined) {
        var residueid = me.icn3d.atoms[i].structure + '_' + me.icn3d.atoms[i].chain + '_' + me.icn3d.atoms[i].resi;
        me.selectedResidues[residueid] = 1;
      }
    }

    me.selectResidueList(me.selectedResidues, name, description);
    me.updateHlAll();

    me.updateSelectionNameDesc();

    //me.setLogCmd('select ' + me.residueids2spec(Object.keys(me.selectedResidues)) + ' | name ' + name + ' | description ' + description, true);
    me.setLogCmd('select ' + me.residueids2spec(Object.keys(me.selectedResidues)) + ' | name ' + name, true);
};

iCn3DUI.prototype.removeSelection = function() { var me = this;
    if(!me.bAnnotations) {
        me.removeSeqChainBkgd();
    }
    //else {
    //    me.removeSeqChainBkgd();
    //}

    if(!me.icn3d.bCtrl && !me.icn3d.bShift) {
        me.removeSeqResidueBkgd();

        me.removeSeqChainBkgd();
    }

//      me.removeSeqChainBkgd();
//      me.removeSeqResidueBkgd();

      me.selectedResidues = {};
      me.icn3d.hAtoms = {};

      me.icn3d.removeHlObjects();

      me.removeHl2D();
};

iCn3DUI.prototype.updateSelectionNameDesc = function() { var me = this;
    var numDef = Object.keys(me.icn3d.defNames2Residues).length + Object.keys(me.icn3d.defNames2Atoms).length;

    $("#" + me.pre + "seq_command_name").val("seq_" + numDef);
    //$("#" + me.pre + "seq_command_desc").val("seq_desc_" + numDef);

    $("#" + me.pre + "seq_command_name2").val("seq_" + numDef);
    //$("#" + me.pre + "seq_command_desc2").val("seq_desc_" + numDef);

    $("#" + me.pre + "alignseq_command_name").val("alseq_" + numDef);
    //$("#" + me.pre + "alignseq_command_desc").val("alseq_desc_" + numDef);
};

iCn3DUI.prototype.selectAChain = function (chainid, commandname, bAlign, bUnion) { var me = this;
    var commandname = commandname.replace(/\s/g, '');
    var command = 'select chain ' + chainid;

    //var residueHash = {}, chainHash = {};

    if(bUnion === undefined || !bUnion) {
        me.icn3d.hAtoms = {};
        me.menuHlHash = {};
    }
    else {
        // update residueHash from me.icn3d.hAtoms
        //residueHash = me.icn3d.getResiduesFromAtoms(me.icn3d.hAtoms);

        // update chainHash from me.icn3d.hAtoms
        //chainHash = me.icn3d.getChainsFromAtoms(me.icn3d.hAtoms);

        me.icn3d.hAtoms = me.icn3d.unionHash(me.icn3d.hAtoms, me.icn3d.chains[chainid]);

        if(me.menuHlHash === undefined) me.menuHlHash = {};
    }

    me.menuHlHash[chainid] = 1;

    //chainHash[chainid] = 1;

    var chnsSeq = (bAlign) ? me.icn3d.alnChainsSeq[chainid] : me.icn3d.chainsSeq[chainid];

    var oriResidueHash = {};
    for(var i = 0, il = chnsSeq.length; i < il; ++i) { // get residue number
        var resObj = chnsSeq[i];
        var residueid = chainid + "_" + resObj.resi;

        var value = resObj.name;

        if(value !== '' && value !== '-') {
          oriResidueHash[residueid] = 1;
          for(var j in me.icn3d.residues[residueid]) {
            me.icn3d.hAtoms[j] = 1;
          }
        }
    }

    if((me.icn3d.defNames2Atoms === undefined || !me.icn3d.defNames2Atoms.hasOwnProperty(chainid)) && (me.icn3d.defNames2Residues === undefined || !me.icn3d.defNames2Residues.hasOwnProperty(chainid)) ) {
        me.addCustomSelection(Object.keys(oriResidueHash), commandname, commandname, command, true);
    }

    if(bAlign) {
        me.updateHlAll(undefined, undefined, bUnion);
    }
    else {
        me.updateHlAll(Object.keys(me.menuHlHash), undefined, bUnion);
    }

//        me.icn3d.addHlObjects();
//        me.updateHl2D(Object.keys(chainHash));
};

iCn3DUI.prototype.selectResidueList = function (residueHash, commandname, commanddescr, bUnion, bUpdateHighlight) { var me = this;
  if(Object.keys(residueHash).length > 0) {
    var chainHash = {};
    if(bUnion === undefined || !bUnion) {
        me.icn3d.hAtoms = {};
        me.menuHlHash = {};
    }
    else {
        if(me.menuHlHash === undefined) me.menuHlHash = {};
    }

    for(var i in residueHash) {
        for(var j in me.icn3d.residues[i]) {
          me.icn3d.hAtoms[j] = 1;
        }
    }

    var commandname = commandname.replace(/\s/g, '');

    me.menuHlHash[commandname] = 1;

    var select = "select " + me.residueids2spec(Object.keys(residueHash));

    var oriResidueArray = Object.keys(residueHash);

    //if( (me.icn3d.defNames2Atoms === undefined || !me.icn3d.defNames2Atoms.hasOwnProperty(commandname)) && (me.icn3d.defNames2Residues === undefined || !me.icn3d.defNames2Residues.hasOwnProperty(commandname)) ) {
        me.addCustomSelection(oriResidueArray, commandname, commanddescr, select, true);
    //}

    if(bUpdateHighlight === undefined || bUpdateHighlight) me.updateHlAll(Object.keys(me.menuHlHash), undefined, bUnion);
  }
};

iCn3DUI.prototype.addCustomSelection = function (residueAtomArray, commandname, commanddesc, select, bSelectResidues) { var me = this;
    if(bSelectResidues) {
        me.icn3d.defNames2Residues[commandname] = residueAtomArray;
    }
    else {
        me.icn3d.defNames2Atoms[commandname] = residueAtomArray;
    }

    me.icn3d.defNames2Command[commandname] = select;
    me.icn3d.defNames2Descr[commandname] = commanddesc;

    me.updateHlMenus([commandname]);
};

