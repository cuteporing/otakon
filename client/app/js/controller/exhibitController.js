//百烈商談
$(function() {
  var exhibitController = $
      .extend(
          {},
          sys.controller.headerController,
          sys.controller.commonController,
          sys.controller.recommendationController,
          {

            __name : 'exhibitController',

            __templates : [
                           'DEPLOY_FOLDER/js/view/header.ejs',
                           'DEPLOY_FOLDER/js/view/popup.ejs',
                           'DEPLOY_FOLDER/js/view/exhibit.ejs',
                           'DEPLOY_FOLDER/js/view/recommendation.ejs'
                           ],

            __page : 'exhibit',
            __lang : null,

            exhibitSysLogic : new sys.logic.ExhibitLogic(),
            commonLogic : new sys.logic.CommonLogic(),

            modelKensaku : null,
            modelSyokiKensaku : null,
            modelSyokiItiran : null,

            SORT_KEY_VALUE : {
              RECOMMENDED : 1, // おすすめ順
              CARNAME : 2, // 車名
              DATE : 3, // 登録日（経過）
              PRICE : 4 // 業販価格
            },
            SORT_ORDER_VALUE : {
              DESCENDING : 0,
              ASCENDING : 1
            },

            __sortKey : null,
            __sortOrder : 1,


            __pageOffset : 0,
            __pageMaxNo : null,
            __pageRecordCount : 0,
            __pageCurrent : 1,
            __pageTotal : 1,

            __searchConditions : {},

            showErrorMessages : false,
            allInputs : [],
            syupinCarNum : 0,
            nonSyupinCarNum : 0,
            warning : false,


            __init : function() {
              var self = this;
              var dfd = this.deferred();
              this.__msg = this.msg_jp;
              sys.common.init(function() {
                self.initLang().done(function(){
                 dfd.resolve();
                });
              });
              return dfd.promise();
            },


            __postInit : function() {
              var self = this;
              var dfd = this.deferred();

              var promWhen = h5.async.when(
                  this.init(),
                  this.itemList());
              promWhen.done(function() {
                self.initscrollDynamic();
                self.isUpdate = false;
                self.subscribeNotification();
                dfd.resolve();
              });
              return dfd.promise();
            },


            __ready : function() {
              this.log.info('start exhibitController __ready');
              this.cmnCheckStyleSheet(this,'#exhibit_list', 'padding-left', '14px');
              google.load('visualization', '1', {'callback':'', 'packages':['corechart']});
              $('#wrapper').show();
            },


            __dispose : function(){
              $('body').css({visibility : 'hidden'}).removeClass('bg');
              // unsubscribe to osirase topic
              sys.common.handleUnsubscribe('/topic/100retsu.sitami.osirase');
              // remove all loader
              sys.common.hideLoading();
            },

            /**
             * Computes page offset
             * @returns
             */
            computeOffset : function(){
              var logic = this.exhibitSysLogic;
              var a = logic.asInt(this.__pageMaxNo);
              var b = logic.asInt(this.__pageCurrent);
              var c = logic.asInt(a * (b - 1));
              return c;
            },

            /**
             * Set warning message
             * @param bool
             */
            setWarning : function(bool){
              if(bool){
                this.warning = true;
                if(!$('body').hasClass('unload-exhibit')){
                  $('body').addClass('unload-exhibit');
                }
                $('#registration_btn').prop('disabled', false);
              }
              else {
                this.warning = false;
                $('body').removeClass('unload-exhibit');
                $('#registration_btn').prop('disabled', true);
              }
            },

            /**
             * Save states of items
             */
            saveState : function(){
              var self = this;
              self.allInputs = [];
//            intentionally leave as is - because list is dynamically generated
              $('#item_list .checked input[type=radio]').each(function(i){
                self.allInputs.push($(this).val());
              });
            },
            '#item_list input change' : function(){
              this.checkChanges();
            },

            /**
             * Check changes and set warning
             */
            checkChanges : function(){
              var changes = false;
              var newInputs = [];
//            intentionally leave as is  - click event
              $('#item_list .checked input[type=radio]').each(function(i){
                newInputs.push($(this).val());
              });
              if(newInputs.length != this.allInputs.length){
                this.setWarning(true);
                return;
              }
              else {
                for(var i=0; i<this.allInputs.length; i++){
                  if(newInputs[i] != this.allInputs[i]){
                    changes = true;
                    break;
                  }
                }
              }
              this.setWarning(changes);
            },


            init : function(){
              var self = this;
              var dfd = this.deferred();

              var promWhen = h5.async.when(self.exhibitSyokiItiran());
              promWhen.done(function() {
                dfd.resolve();
              });
              return dfd.promise();
            },

            exhibitUnitsNum : function(){
              var dfd = this.deferred();
              var lang = {lang : this.__lang};
              this.changeView(this, dfd, '#units_num', this.__page + '_units_num', lang, this.isUpdate);
              dfd.resolve();
              return dfd.promise();
            },
            exhibitPagination : function(){
              var dfd = this.deferred();
              var lang = {lang : this.__lang};
              this.changeView(this, dfd, '#pagination_1, #pagination_2', this.__page + '_pagination', lang, this.isUpdate);
              dfd.resolve();
              return dfd.promise();
            },
            exhibitSyokiItiran : function(){
              var self = this;
              var dfd = this.deferred();
              var timeout = sys.common.showLoading('main_sand_loader', 'wrapper');
              this.exhibitSysLogic.syokiItiran({})
              .done(function(res){
                self.modelSyokiItiran = res.data;
                sys.common.hideLoading(timeout,'main_sand_loader');
                dfd.resolve();
              }).fail(function(){
                sys.common.hideLoading(timeout,'main_sand_loader');
              });
              return dfd.promise();
            },

            exhibitWrapper : function(){
              var dfd = this.deferred();
              var data = {
                  lang : this.__lang,
                  msg : this.__msg
              };
              this.changeView(this, dfd, '#wrapper', this.__page + '_wrapper', data, this.isUpdate);

              dfd.resolve();
              return dfd.promise();
            },

            exhibitSubHeader : function(){
              var dfd = this.deferred();
              var data = {
                  lang : this.__lang
              };
              if(this.modelKensaku != null){
                data.data = this.modelKensaku.get('syaryoSummary');
              }
              else {
                data.data = {
                    pageMaxNo : 0,
                    carSelected : 0,
                    syupinCarNum : 0,
                    nonSyupinCarNum : 0
                };
              }
              this.changeView(this, dfd, '#sub_nav', this.__page + '_sub_header', data, this.isUpdate);
              dfd.resolve();
              return dfd.promise();
            },


            titleBar : function(isUpdate){
              var dfd = this.deferred();
              var data = {
                  lang : this.__lang,
                  logic : this.exhibitSysLogic
              };
              if(this.modelKensaku != null){
                data.data = this.modelKensaku.get('kaisaiList');
              }
              else {
                data.data = {
                    spnFrom : '',
                    spnTo : '',
                    kaisaiNo : 0,
                    auctionFrom : ''
                };
              }
              this.changeView(this, dfd, '#title_bar', this.__page  + '_title_bar', data, isUpdate);
              dfd.resolve();
              return dfd.promise();
            },


            exhibitHeader : function(){
              var dfd = this.deferred();
              var syaryoSummary = {
                  pageMaxNo : 0,
                  carSelected : 0,
                  syupinCarNum : 0,
                  nonSyupinCarNum : 0
              };
              if(this.modelKensaku != null){
                syaryoSummary = this.modelKensaku.get('syaryoSummary');
              }

              this.syupinCarNum = syaryoSummary.syupinCarNum;
              this.nonSyupinCarNum = syaryoSummary.nonSyupinCarNum;
              $('#syupinCarNum').html(this.syupinCarNum);
              $('#nonSyupinCarNum').html(this.nonSyupinCarNum);

              dfd.resolve();
              return dfd.promise();
            },


            itemList : function(){
              var self = this;
              var dfd = this.deferred();
              var data = this.getSyupinKensakuReqParam(1);

              var inventoryNo = h5.api.storage.session.getItem('exhbtInqNo');
              h5.api.storage.session.removeItem('exhbtInqNo'); // one time only
              if(inventoryNo != null){
                data.inventoryNoFROM = inventoryNo;
                data.inventoryNoTO = inventoryNo;

                var temp = JSON.parse(h5.api.storage.session.getItem('exhibitSettingsSearch'));
                if(temp == null){
                  temp = {};
                }
                temp.inventoryNoFROM = inventoryNo;
                temp.inventoryNoTO = inventoryNo;

                h5.api.storage.session.removeItem('exhibitSettingsSearch');
                h5.api.storage.session.setItem('exhibitSettingsSearch', JSON.stringify(temp));
              }
              var timeout = sys.common.showLoading('main_sand_loader', 'wrapper');
              this.exhibitSysLogic.syupinKensaku(data)
              .done(function(res){
                self.modelKensaku = res.data;
                self.__pageRecordCount = self.modelKensaku.get('syaryoSummary').carSelected;
                self.exhibitWrapper();
                self.initRecommendList();
                self.initHeader();
                self.setPopup();
                self.exhibitUnitsNum();
                self.exhibitPagination();
                self.exhibitHeader();
                self.exhibitSubHeader();
                self.titleBar(self.isUpdate);
                self.pagination();
                self.setItemList();
                sys.common.hideLoading(timeout,'main_sand_loader');
                dfd.resolve();
              }).fail(function(){
                sys.common.hideLoading(timeout,'main_sand_loader');
              });

              return dfd.promise();
            },



            sortData : function($el){
              var self = this;
              this.exhibitWarning(function(res){
                if(res){
                  self.processSort($el);
                }
              });
            },

//          intentionally leave as is (find and class) - click event
            processSort : function($el){
              this.__sortOrder = (this.__sortOrder == this.SORT_ORDER_VALUE.ASCENDING)?
                  this.SORT_ORDER_VALUE.DESCENDING : this.SORT_ORDER_VALUE.ASCENDING;
//            intentionally leave as is - click event
              $el.parent().find('.exhibit-sorting').removeClass('active');
              $el.addClass('active');

              var className = 'asc';
//            intentionally leave as is - click event
              if($el.find('span').hasClass('asc')){
                className = 'desc';
                this.__sortOrder == this.SORT_ORDER_VALUE.DESCENDING;
              }
              else {
                this.__sortOrder == this.SORT_ORDER_VALUE.ASCENDING;
              }
//            intentionally leave as is - click event
              $el.find('span').removeClass('asc').removeClass('desc');
//            intentionally leave as is - click event
              $el.find('span').addClass(className);

              this.__searchConditions.sortKey = this.__sortKey;
              this.__searchConditions.sortOrder = this.__sortOrder;
              this.__searchConditions.pageOffset = this.__pageOffset;
              this.__searchConditions.pageMaxNo = this.__pageMaxNo;

              var self = this;
              var dfd = this.deferred();

              var timeout = sys.common.showLoading('main_sand_loader', 'wrapper');
              this.exhibitSysLogic.syupinKensaku(this.__searchConditions)
              .done(function(res){
                self.modelKensaku = res.data;
                self.__pageRecordCount = self.modelKensaku.get('syaryoSummary').carSelected;
                self.__pageCurrent = 1;
                self.pagination();
                self.setItemList();
                sys.common.hideLoading(timeout,'main_sand_loader');
                dfd.resolve();
              }).fail(function(){
                sys.common.hideLoading(timeout,'main_sand_loader');
              });

              return dfd.promise();
            },


            firstPage : function (){
              this.__pageCurrent = 1;
            },
            prevPage : function (){
              this.__pageCurrent--;
              if(this.__pageCurrent < 1) this.firstPage();
            },
            nextPage : function (){
              this.__pageCurrent++;
              if(this.__pageCurrent > this.__pageTotal) this.lastPage();
            },
            lastPage : function (){
              this.__pageCurrent = this.__pageTotal;
            },


//          intentionally leave as is (find and class) - click event
            pagination : function(){
              var dfd = this.deferred();
              this.__pageMaxNo = (this.__pageMaxNo == null)?
                  sys.config.PAGE_HYOUJI_DEFA : this.__pageMaxNo;

              // computation
              this.__pageTotal = Math.ceil(this.__pageRecordCount / this.__pageMaxNo);

              // display
              $('#pagination_1 #__pageTotal').html(this.__pageTotal);
              $('#pagination_2 #__pageTotal').html(this.__pageTotal);
              $('#__pageRecordCount').html(this.__pageRecordCount);

              // load page-hyouji-suu
              var arr = sys.config.PAGE_HYOUJI_SUU;
              var opts = '';
              for ( var i in sys.config.PAGE_HYOUJI_SUU) {
                opts += '<option value="' + arr[i] + '"'
                    + ((this.__pageMaxNo == arr[i]) ? ' selected ' : '')
                    + '>' + arr[i] + '</option>';
              }
              $('#page-hyouji-suu').html(opts);

              // load pages
              opts = '';
              for (i=1; i<=this.__pageTotal; i++) {
                opts += '<option value="' + i + '"'
                    + ((this.__pageCurrent == i) ? ' selected ' : '')
                    + '>' + i + '</option>';
              }
              $('#pagination_1 #pages').html(opts);
              $('#pagination_2 #pages').html(opts);

              // hide and show
              if (this.__pageCurrent == 1) {
//              intentionally leave as is - click event
                $('#exhibit_main_list .paging_first').hide();
                $('#exhibit_main_list .paging_prev').hide();
              }
              else {
//              intentionally leave as is - click event
                $('#exhibit_main_list .paging_first').show();
                $('#exhibit_main_list .paging_prev').show();
              }
              if (this.__pageCurrent == this.__pageTotal || this.__pageTotal <= 0) {
//              intentionally leave as is - click event
                $('#exhibit_main_list .paging_next').hide();
                $('#exhibit_main_list .paging_last').hide();
              }
              else {
//              intentionally leave as is - click event
                $('#exhibit_main_list .paging_next').show();
                $('#exhibit_main_list .paging_last').show();
              }
              dfd.resolve();
              return dfd.promise();
            },


            updatePaginationHyouji : function(){
              // computation
              this.__pageTotal = Math.ceil(this.__pageRecordCount / this.__pageMaxNo);
              this.__pageCurrent = 1;

              // display
              $('#pagination_1 #__pageTotal').html(this.__pageTotal);
              $('#pagination_2 #__pageTotal').html(this.__pageTotal);

              // load pages
              opts = '';
              for (var i=1; i<=this.__pageTotal; i++) {
                opts += '<option value="' + i + '"'
                    + ((this.__pageCurrent == i) ? ' selected ' : '')
                    + '>' + i + '</option>';
              }
              $('#pagination_1 #pages').html(opts);
              $('#pagination_2 #pages').html(opts);
            },

//          intentionally leave as is (find and class) - click event
            updatePagination : function(){
              $('#pagination_1 #pages').val(this.__pageCurrent);
              $('#pagination_2 #pages').val(this.__pageCurrent);

              // hide and show
              if (this.__pageCurrent == 1) {
//              intentionally leave as is - click event
                $('#exhibit_main_list .paging_first').hide();
                $('#exhibit_main_list .paging_prev').hide();
              }
              else {
//              intentionally leave as is - click event
                $('#exhibit_main_list .paging_first').show();
                $('#exhibit_main_list .paging_prev').show();
              }
              if (this.__pageCurrent == this.__pageTotal || this.__pageTotal <= 0) {
//              intentionally leave as is - click event
                $('#exhibit_main_list .paging_next').hide();
                $('#exhibit_main_list .paging_last').hide();
              }
              else {
//              intentionally leave as is - click event
                $('#exhibit_main_list .paging_next').show();
                $('#exhibit_main_list .paging_last').show();
              }
            },


            updateItemListApi : function(){
              this.__searchConditions.pageOffset = this.computeOffset();
              this.__searchConditions.pageMaxNo = this.__pageMaxNo;
              var self = this;
              var dfd = this.deferred();

              var timeout = sys.common.showLoading('main_sand_loader', 'wrapper');
              this.exhibitSysLogic.syupinKensaku(this.__searchConditions)
              .done(function(res){
                self.modelKensaku = res.data;
                self.__pageRecordCount = self.modelKensaku.get('syaryoSummary').carSelected;
                self.exhibitHeader();
                self.titleBar(true);
                self.setItemList();
                self.pagination();
                sys.common.hideLoading(timeout,'main_sand_loader');
                dfd.resolve();
              }).fail(function(){
                sys.common.hideLoading(timeout,'main_sand_loader');
              });

              return dfd.promise();
            },
//          intentionally leave as is (find and class) - because list is dynamically generated
            setItemList : function(){
              var dfd = this.deferred();
              var data = {
                  logic: this.exhibitSysLogic,
                  data: this.modelKensaku.get('zaikoList'),
                  lang : this.__lang
              };

              $('#exhibit_list').scrollTop(0);
              $('#item_list').empty();
              this.changeView(this, dfd, '#item_list', this.__page + '_item', data, this.isUpdate);
              this.saveState();

//            intentionally leave as is - because list is dynamically generated
              $('#item_list li .photo').on('error',function(){
                $(this).attr('src', 'DEPLOY_FOLDER/images/no-image.jpg');
              });
              this.setWarning(false);
              dfd.resolve();
              return dfd.promise();
            },

            updateItemList : function(){
              var dfd = this.deferred();
              var arr = this.modelKensaku.get('zaikoList');
              var logic = this.exhibitSysLogic;

              var c = logic.asInt(this.__pageCurrent);
              var r = logic.asInt(this.__pageMaxNo);
              var x = (c * r) - r;
              var y = x + r;
              var filterd = arr.slice(x, y);

              $('#item_list').empty();
              this.changeView(this, dfd, '#item_list', this.__page + '_item', {logic: this.exhibitSysLogic, data: filterd, lang : this.__lang}, this.isUpdate);
              this.saveState();
              this.setWarning(false);

              dfd.resolve();
              return dfd.promise();
            },


            drawChart : function(inventoryYear, inventoryNo, year, carname, mileage) {
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              var self = this;
              var dfd = this.deferred();

              var reqData = {
                  inventoryYear : inventoryYear,
                  inventoryNo : inventoryNo,
              };

              var logic = this.exhibitSysLogic;
              var viewData = {
                  lang: self.__lang,
                  logic : self.exhibitSysLogic,
                  year : year,
                  carname : carname,
                  mileage : null
              };

              self.changeView(self, dfd, '#exhibit_modal', self.__page+'_google_graph', viewData, false);

              var timeout = sys.common.showLoading('main_sand_loader', 'wrapper');
              this.exhibitSysLogic.soubaHyouji(reqData)
              .done(function(res){
                var model = res.data;
                var priceList = model.get('priceList');
                if(priceList.length <= 0){
                  sys.common.hideLoading(timeout,'main_sand_loader');
                  return;
                }
                var values = [];
                for(var i=0; i<priceList.length; i++){
                  var v = parseFloat(priceList[i].price);
                  values.push(v);
                }
                values = values.sort(function(a, b){
                  sys.common.hideLoading(timeout,'main_sand_loader');
                  return a-b;
                });

                var mileAgeWidth = 0;
                try {
                  if(self.modelSyokiItiran != null){
                    mileAgeWidth = logic.asInt(self.modelSyokiItiran.get('soba').mileageWidth);
                  }
                }
                catch(e) {
                  mileAgeWidth = 0;
                }

                var mileAge = logic.asInt(mileage);
                var minMileage = logic.asInt(mileAge - mileAgeWidth);
                if(minMileage <= 0) minMileage = 0;
                var maxMileage = logic.asInt(mileAge + mileAgeWidth);
                if(maxMileage <= 0) minMileage = 0;
                viewData.mileage = self.exhibitSysLogic.displayMileAge(minMileage)
                      + '～' + self.exhibitSysLogic.displayMileAge(maxMileage);

                var min = values[0];
                var max = values[values.length-1];
                var diff = max - min;
                var div = diff / 5;
                div = parseInt(div.toFixed(0));
                var a = min;
                var b = a + div;
                var ticks = [];
                var highest = 0;
                var arr = [];
                for(var i=0; i<6; i++){
                  b = a + div;

                  var ctr = 0;
                  for(var x=0; x<values.length; x++){
                    if(values[x] >= a && values[x] < b){
                      ctr++;
                    }
                  }

                  if(ctr > highest){
                    highest = ctr;
                  }

                  var pushA = a/10;
                  pushA = pushA.toFixed(1);
                  arr.push([pushA + '', ctr, pushA]);

                  for(var y=0; y<ctr; y++){
                    values.shift();
                  }
                  a = b;
                }

                var last2 = arr[arr.length-2];
                var last = arr[arr.length-1];
                var newLast = ['', 0, ''];
                newLast[0] = last2[0];
                newLast[1] = last2[1] + last[1];
                newLast[2] = last2[2];

                if(newLast[1] > highest){
                  highest = newLast[1];
                }

                arr.pop();
                arr.pop();
                arr.push(newLast);

                if(highest > 9){
                  var h = Math.ceil(highest/10);
                  for(var y=0; y<10; y++){
                    var tick = (h * y);
                    ticks.push(tick);
                  }
                  highest = (h * 10);
                }
                else {
                  for(var y=0; y<=highest; y++){
                    ticks.push(y);
                  }
                  highest++;
                }
                ticks.push({v:highest, f:'件'});

                self.changeView(self, dfd, '#exhibit_modal', self.__page+'_google_graph', viewData, true);

                // Create the data table.
                var data = new google.visualization.DataTable();
                data.addColumn('string', 'price');
                data.addColumn('number', 'qty');
                data.addColumn({type: 'string', role: 'tooltip'});
                data.addRows(arr);

                var lastVal = b-div;
                lastVal = lastVal/10;
                lastVal = lastVal.toFixed(1);

                var options = {
                  legend : {position : 'none'},
                  width : 550,
                  bar: {groupWidth: '99%'},
                  vAxis: {
                    ticks: ticks,
                    gridlines: { count: ticks.length }
                  },
                  hAxis : {title:lastVal + '万円'}
                };

                var chart = new google.visualization.ColumnChart(document.getElementById('registration_graph'));
                chart.draw(data, options);

                var x = 85;
                var y = 0;
                var len = $('#registration_graph svg g text[text-anchor=middle]').length;
                var ctr = 1;
                $('#registration_graph svg g text[text-anchor=middle]').each(function(){
                  if(ctr < len){
                    var xpos = $(this).attr('x');
                    $(this).attr('x', parseFloat(xpos) - 34.7);
                    x = parseFloat(xpos) + 39.7 + 15; // 39.7
                    y = $(this).attr('y');
                  }
                  if(ctr == len){
                    $(this).attr('x', x).attr('y', y);
                    $(this).removeAttr('font-style');
                  }
                  ctr++;
                });
                sys.common.hideLoading(timeout,'main_sand_loader');
                dfd.resolve();
              }).fail(function(){
                sys.common.hideLoading(timeout,'main_sand_loader');
              });
              return dfd.promise();
            },


            closeModal : function(){
              $('#exhibit_modal').empty()
                .removeClass('registration_modal')
                .removeClass('exhibit_search_setting_modal')
                .removeClass('graph')
                .hide();
            },
            registrationModal : function(){
              $('#exhibit_modal').removeClass('exhibit_search_setting_modal')
                .removeClass('graph')
                .addClass('registration_modal')
                .show();
            },
            graphModal : function(){
              $('#exhibit_modal').removeClass('exhibit_search_setting_modal')
                .addClass('registration_modal')
                .addClass('graph')
                .show();
            },
            searchModal : function(){
              $('#exhibit_modal').removeClass('registration_modal')
                .removeClass('graph')
                .addClass('exhibit_search_setting_modal')
                .show();
            },


            fillMakerList : function(){
              var list = this.modelSyokiKensaku.get('makerList');
              var opts = '<option value="">&nbsp;</option>';
              for(var n=0; n<list.length; n++){
                opts += '<option value="' + list[n].get('makerCD') + '">'
                + list[n].get('maker') + '</option>';
              }
              $('#maker').html(opts).val(null);
            },

            fillPostInfoList : function(){
              var list = this.modelSyokiKensaku.get('postInfoList');
              var opts = '';
              for(var n=0; n<list.length; n++){
                opts += '<option value="' + list[n].get('postStatus1Kbn') + '">'
                + list[n].get('postStatus1Nm') + '</option>';
              }
              $('#syupinKeisaiFlg').html(opts).val(null);
            },

            fillStatus2InfoList : function(postStatus1Kbn){
              var arr = [];
              var opts = '';
              var postInfoList = this.modelSyokiKensaku.get('postInfoList');
              for(var i=0; i<postInfoList.length; i++){
                if(postInfoList[i].get('postStatus1Kbn') == postStatus1Kbn){
                  arr = postInfoList[i].get('postStatus2InfoList');
                  break;
                }
              }

              for(var n=0; n<arr.length; n++){
                opts += '<option value="' + arr[n]['postStatus2Kbn'] + '">'
                + arr[n]['postStatus2Nm'] + '</option>';
              }

              $('#syupinKeisaiStatus').html(opts);
            },

            fillCarList : function(makerCD){
              var data = this.modelSyokiKensaku.get('makerList');
              var carListData = [];
              if(makerCD == null){
                for(var i=0; i<data.length; i++){
                  carListData = data[i].get('carList');
                  break;
                }
              }
              else {
                for(var i=0; i<data.length; i++){
                  if(data[i].get('makerCD') == makerCD){
                    carListData = data[i].get('carList');
                    break;
                  }
                }
              }
              var opts = '<option value="">&nbsp;</option>';
              for(var n=0; n<carListData.length; n++){
                opts += '<option value="' + carListData[n]['carnameCD'] + '">'
                + carListData[n]['carname'] + '</option>';
              }

              $('#carname').html(opts);
            },


            '#sort_recommend click' : function(context, $el){
              this.__sortKey = this.SORT_KEY_VALUE.RECOMMENDED;
              this.sortData($el);
            },
            '#sort_cars click' : function(context, $el){
              this.__sortKey = this.SORT_KEY_VALUE.CARNAME;
              this.sortData($el);
            },
            '#sort_date click' : function(context, $el){
              this.__sortKey = this.SORT_KEY_VALUE.DATE;
              this.sortData($el);
            },
            '#sort_price click' : function(context, $el){
              this.__sortKey = this.SORT_KEY_VALUE.PRICE;
              this.sortData($el);
            },

            exhibitWarning : function(callback){
              var self = this;
              var bool = $('#registration_btn').prop('disabled');
              if(!bool){
                $('body #exhibit_warning_modal').show();
//              intentionally leave as is - click event
                $('body #exhibit_warning_modal .ok').off();
                $('body #exhibit_warning_modal .ok').click(function(){
                  $('body #exhibit_warning_modal').hide();
                  self.setWarning(false);
                  callback(true);
                });
              }
              else {
                callback(true);
              }
            },

//          intentionally leave as is (find and class) - click event
            '#exhibit_main_list .paging_first click' : function(){
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              var self = this;
              this.exhibitWarning(function(res){
                if(res){
                  self.firstPage();
                  self.updateItemListApi();
                }
              });
            },
//          intentionally leave as is (find and class) - click event
            '#exhibit_main_list .paging_prev click' : function(){
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              var self = this;
              this.exhibitWarning(function(res){
                if(res){
                  self.prevPage();
                  self.updateItemListApi();
                }
              });
            },
//          intentionally leave as is (find and class) - click event
            '#exhibit_main_list .paging_next click' : function(){
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              var self = this;
              this.exhibitWarning(function(res){
                if(res){
                  self.nextPage();
                  self.updateItemListApi();
                }
              });
            },
//          intentionally leave as is (find and class) - click event
            '#exhibit_main_list .paging_last click' : function(){
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              var self = this;
              this.exhibitWarning(function(res){
                if(res){
                  self.lastPage();
                  self.updateItemListApi();
                }
              });
            },
            '#page-hyouji-suu change' : function(){
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              var self = this;
              this.exhibitWarning(function(res){
                if(res){
                  self.__pageMaxNo = $('#page-hyouji-suu').val();
                  self.__pageCurrent = 1;
                  self.updateItemListApi();
                }
                else {
                  $('#page-hyouji-suu').val(self.__pageMaxNo);
                }
              });
            },
            '#pagination_1 #pages , #pagination_2 #pages change' : function(context, $el){
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              var self = this;
              this.exhibitWarning(function(res){
                if(res){
                  self.__pageCurrent = $el.val();
                  self.updateItemListApi();
                }
                else {
                  $el.val(self.__pageCurrent);
                }
              });
            },

//          intentionally leave as is (find and class) - click event
            '#exhibit_list li .graph_link click' : function(context, $el) {
              this.closeModal();
              var inventoryYear = $el.attr('data-inventoryYear');
              var inventoryNo = $el.attr('data-inventoryNo');
              var year = $el.attr('data-year');
              var carname = $el.attr('data-carname');
              var mileage = $el.attr('data-mileage');

              this.drawChart(inventoryYear, inventoryNo, year, carname, mileage);
              this.graphModal();
            },
//          intentionally leave as is (find and class) - click event
            '#exhibit_warning_modal .cancel click' : function(context, $el) {
              $('#exhibit_warning_modal').hide();
            },
//          intentionally leave as is (find and class) - click event
            '#exhibit_modal .close click' : function() {
              this.closeModal();
              $('#search_btn').removeClass('active');
            },
            '#exhibit_modal #close click' : function() {
              this.closeModal();
              $('#search_btn').removeClass('active');
            },
//          intentionally leave as is (find and class) - click event
            '#exhibit_modal .clear click' : function() {
              h5.api.storage.session.removeItem('exhibitSettingsSearch');
              $('#exhibit_modal #exhibit_search_table :input')
                .each(function(){
                  $(this).val(null);
              });
            },


//          intentionally leave as is (find and class) - click event
            '#exhibit_content mouseup' : function(context, $el){
              var e = context.event;
              var inputs = $('#item_list input');
//            intentionally leave as is - because list is dynamically generated
              var radio = $('#item_list .radio_btn');
              var radioSpan = $('#item_list .radio_btn span');
              var registrationBtn = $('#registration_btn');
//            intentionally leave as is - because list is dynamically generated
              var graph = $('.graph_link');

              var paginationLinks = $('#pagination_1 a, #pagination_2 a');
              var paginationHyouji = $('#page-hyouji-suu');
              var paginationPages = $('#pagination_1 #pages, #pagination_2 #pages');

              if(inputs.is(e.target)
                  || radio.is(e.target)
                  || radioSpan.is(e.target)
                  || registrationBtn.is(e.target)
                  || graph.is(e.target)
                  || paginationLinks.is(e.target)
                  || paginationHyouji.is(e.target)
                  || paginationPages.is(e.target))
                  {
                return;
              }

              if(this.showErrorMessages){
//              intentionally leave as is - because list is dynamically generated
                $('#item_list #price_setup .error_msg').show();
                $('#item_list #price_setup .warning_msg').show();
                this.showErrorMessages = false;
              }
              else {
//              intentionally leave as is - because list is dynamically generated
                $('#item_list #price_setup .error_msg').hide();
                $('#item_list #price_setup .warning_msg').hide();
                this.showErrorMessages = true;
              }
            },
//          intentionally leave as is (find and class) - because list is dynamically generated
            '#exhibit_list li:not(.disabled) #price_setup input.ten focusin' : function(context, $el){
//              intentionally leave as is - because list is dynamically generated
                $el.closest('#price_setup').find('.error_msg').hide();
//              intentionally leave as is - because list is dynamically generated
                $el.closest('#price_setup').find('.warning_msg').hide();
            },
//          intentionally leave as is (find and class) - because list is dynamically generated
            '#exhibit_list li:not(.disabled) #price_setup input[type=tel] focusout' : function(context, $el){
              this.setPercentValue(context, $el);
              this.checkInput($el, true);
            },
//          intentionally leave as is (find and class) - because list is dynamically generated
//            '#exhibit_list li:not(.disabled) #price_setup input#uriYenDec focusout' : function(context, $el){
//              this.setPercentValue(context, $el);
//              this.checkInput($el, true);
//            },
            /**
             * Validates input
             * @param context
             * @param $el
             */
            '#exhibit_list li #price_setup input[type=tel] keydown' : function(context, $el){
              var e = context.event;
              if(sys.common.numericOnly(context)){
                return;
              }
              e.preventDefault();
            },

//          intentionally leave as is (find and class) - because list is dynamically generated
            /**
             * Set the corresponding percentage value
             */
            setPercentValue : function(context, $el){
              var self = this;
              var logic = this.exhibitSysLogic;

              var e = context.event;
//            intentionally leave as is - because list is dynamically generated
              var uriInputs = $('#exhibit_list li:not(.disabled) #price_setup input#uriYen');
              var uriDecInputs = $('#exhibit_list li:not(.disabled) #price_setup input#uriYenDec');
              if(uriInputs.is(e.target) || uriDecInputs.is(e.target)){
                var closest = $el.closest('#price_setup');
//              intentionally leave as is - because list is dynamically generated
                var uriYenInput = $(closest).find('input#uriYen').val();
//              intentionally leave as is - because list is dynamically generated
                var uriYenDec = $(closest).find('input#uriYenDec').val();

                var uriYen = logic.requestYen(uriYenInput, uriYenDec);
                var teisuList = [];
                if(self.modelSyokiItiran != null){
                  teisuList = self.modelSyokiItiran.get('teisuList');
                }
                var value = logic.getPercentValue(uriYen, teisuList);
//              intentionally leave as is - because list is dynamically generated
                $(closest).find('input#startYen').val(logic.displayYenNoDecimal(value));
//              intentionally leave as is - because list is dynamically generated
                $(closest).find('input#startYenDec').val(logic.displayYenOnlyDecimal(value));
              }
            },

//          intentionally leave as is (find and class) - because list is dynamically generated
            /**
             * Check input has not within the range of percentage
             */
            checkInputPercent : function(el, showGraph){
              var self = this;
              var logic = this.exhibitSysLogic;
              var dataID = $(el).attr('data-id');

              var elemParent = $(el).parent();
              var closest = $(el).closest('#price_setup');
//            intentionally leave as is - because list is dynamically generated
              var uriYenInput = $(closest).find('input#uriYen').val();
//            intentionally leave as is - because list is dynamically generated
              var uriYenDec = $(closest).find('input#uriYenDec').val();
//            intentionally leave as is - because list is dynamically generated
              var uriYenParent = $(closest).find('input#uriYen').parent();

              var uriYen = logic.requestYen(uriYenInput, uriYenDec);

              var sobaMax = null;
              try {
                sobaMax = logic.asInt($(closest).attr('data-sobaMax'));
              } catch (e) {
                sobaMax = null;
              }

//            intentionally leave as is - because balloon is dynamically generated
              $(elemParent).find('.warning_msg').show();

              if(dataID == 'uriYenDec'){
                elemParent = uriYenParent;
                dataID = 'uriYen';
              }

              // price checking
              if(dataID == 'uriYen'
                  && !logic.isEmpty(sobaMax)
                  && !logic.isEmptyNumeric(sobaMax)
                  && uriYen > sobaMax){
//              intentionally leave as is - because balloon is dynamically generated
                $(uriYenParent).removeClass('warning').find('.warning_msg').remove();
                if(showGraph){
                  // check if modal screen is currently displayed
                  if($('#exhibit_modal').css('display') != 'none'){
                    showGraph = false;
                  }
                }
                self.putInputWarning(uriYenParent, self.__msg.WRG0020, showGraph);
                return false;
              }
              else {
//              intentionally leave as is - because balloon is dynamically generated
                $(uriYenParent).removeClass('warning').find('.warning_msg').remove();
              }
              return true;
            },


//          intentionally leave as is (find and class) - because list is dynamically generated
            /**
             * Validates input
             */
            checkInput : function(el, showGraph){
              var self = this;
              var logic = this.exhibitSysLogic;
              var reg = new RegExp(/^[0-9]+$/);
              var dataID = $(el).attr('data-id');

//              if(dataID == 'itigekiYenDec'
//                  || dataID == 'uriYenDec'
//                  || dataID == 'startYenDec'){
//                return;
//              }

              var elemParent = $(el).parent();
              var value = $(el).val();

              var closest = $(el).closest('#price_setup');
//            intentionally leave as is - because list is dynamically generated
              var itigekiYenInput = $(closest).find('input#itigekiYen').val();
//            intentionally leave as is - because list is dynamically generated
              var itigekiYenDec = $(closest).find('input#itigekiYenDec').val();
//            intentionally leave as is - because list is dynamically generated
              var itigekiYenParent = $(closest).find('input#itigekiYen').parent();
//            intentionally leave as is - because list is dynamically generated
              var uriYenInput = $(closest).find('input#uriYen').val();
//            intentionally leave as is - because list is dynamically generated
              var uriYenDec = $(closest).find('input#uriYenDec').val();
//            intentionally leave as is - because list is dynamically generated
              var uriYenParent = $(closest).find('input#uriYen').parent();
//            intentionally leave as is - because list is dynamically generated
              var startYenInput = $(closest).find('input#startYen').val();
//            intentionally leave as is - because list is dynamically generated
              var startYenDec = $(closest).find('input#startYenDec').val();
//            intentionally leave as is - because list is dynamically generated
              var startYenParent = $(closest).find('input#startYen').parent();

              var itigekiYen = logic.requestYen(itigekiYenInput, itigekiYenDec);
              var uriYen = logic.requestYen(uriYenInput, uriYenDec);
              var startYen = logic.requestYen(startYenInput, startYenDec);

              var sobaMax = null;
              try {
                sobaMax = logic.asInt($(closest).attr('data-sobaMax'));
              } catch (e) {
                sobaMax = null;
              }

              var teisuList = [];
              if(self.modelSyokiItiran != null){
                teisuList = self.modelSyokiItiran.get('teisuList');
              }

//            intentionally leave as is - because balloon is dynamically generated
              $(elemParent).find('.error_msg').show();
//            intentionally leave as is - because balloon is dynamically generated
              $(elemParent).find('.warning_msg').show();

              if(dataID == 'itigekiYenDec'){
                elemParent = itigekiYenParent;
                value = itigekiYenInput;
                dataID = 'itigekiYen';
              }
              else if(dataID == 'uriYenDec'){
                elemParent = uriYenParent;
                value = uriYenInput;
                dataID = 'uriYen';
              }
              else if(dataID == 'startYenDec'){
                elemParent = startYenParent;
                value = startYenInput;
                dataID = 'startYen';
              }
              

              // mandatory
              if(logic.isEmptyOrZero(itigekiYen) && dataID == 'itigekiYen'){
//              intentionally leave as is - because balloon is dynamically generated
                $(itigekiYenParent).removeClass('error').find('.error_msg').remove();
                self.putInputError(elemParent, this.__msg.MSGC0020);
                return false;
              }
              else if(logic.isEmptyOrZero(uriYen) && dataID == 'uriYen'){
//              intentionally leave as is - because balloon is dynamically generated
                $(uriYenParent).removeClass('error').find('.error_msg').remove();
                self.putInputError(elemParent, this.__msg.MSGC0021);
                return false;
              }
              else if(logic.isEmptyOrZero(startYen) && dataID == 'startYen'){
//              intentionally leave as is - because balloon is dynamically generated
                $(startYenParent).removeClass('error').find('.error_msg').remove();
                self.putInputError(elemParent, this.__msg.MSGC0022);
                return false;
              }
              // input checking
              else if(!logic.isEmpty(value) && !reg.test(value)){
                self.putInputError(elemParent, '数値を入力してください');
                return false;
              }
              // price checking
              else if(dataID == 'uriYen'
                  && !logic.isEmpty(sobaMax)
                  && !logic.isEmptyNumeric(sobaMax)
                  && uriYen > sobaMax){
//              intentionally leave as is - because balloon is dynamically generated
                $(uriYenParent).removeClass('warning').find('.warning_msg').remove();
                if(showGraph){
                  // check if modal screen is currently displayed
                  if($('#exhibit_modal').css('display') != 'none'){
                    showGraph = false;
                  }
                }
                self.putInputWarning(elemParent, self.__msg.WRG0020, showGraph);
                return false;
              }
              else if(dataID == 'uriYen'
                  && !logic.isEmptyOrZero(uriYen)
                  && !logic.isEmptyOrZero(itigekiYen)
                  && uriYen > itigekiYen){
//              intentionally leave as is - because balloon is dynamically generated
                $(uriYenParent).removeClass('error').find('.error_msg').remove();
                self.putInputError(elemParent, self.__msg.MSGC0023);
                return false;
              }
              else if(dataID == 'startYen'
                  && !logic.checkPercent(startYen, uriYen, teisuList)){
//              intentionally leave as is - because balloon is dynamically generated
                $(startYenParent).removeClass('error').find('.error_msg').remove();
                var percent = logic.getPercent(uriYen, teisuList);
                var customMsg = self.__msg.MSGC0024.replace('N%', percent + '%');
                self.putInputError(elemParent, customMsg);
                return false;
              }
              else if(dataID == 'startYen'
                  && !logic.isEmptyOrZero(startYen)
                  && !logic.isEmptyOrZero(uriYen)
                  && startYen > uriYen){
//              intentionally leave as is - because balloon is dynamically generated
                $(startYenParent).removeClass('error').find('.error_msg').remove();
                self.putInputError(elemParent, self.__msg.MSGC0025);
                return false;
              }
              else {
//              intentionally leave as is - because balloon is dynamically generated
                $(elemParent).removeClass('error').find('.error_msg').remove();
//              intentionally leave as is - because balloon is dynamically generated
                $(elemParent).removeClass('warning').find('.warning_msg').remove();
              }
              return true;
            },

//          intentionally leave as is (find and class) - because balloon is dynamically generated
            /**
             * Set the error message (balloon) for price input checks
             */
            putInputError : function(el, msg){
              if(!$(el).hasClass('error')){
                $(el).addClass('error');
              }
//            intentionally leave as is - because balloon is dynamically generated
              $(el).removeClass('warning')
                .find('.warning_msg').remove();
//            intentionally leave as is - because balloon is dynamically generated
              $(el).find('.error_msg').remove();
              $(el).append('<i class="error_msg">'+ msg +'</i>');
            },

//             intentionally leave as is (find and class) - because balloon is dynamically generated
            /**
             * Set the warning message (balloon) for price input checks
             * Open graph
             */
            putInputWarning : function(el, msg, showGraph){
              if(!$(el).hasClass('warning')){
                $(el).addClass('warning');
              }
//            intentionally leave as is - because balloon is dynamically generated
              $(el).removeClass('error')
                .find('.error_msg').remove();
//            intentionally leave as is - because balloon is dynamically generated
              $(el).find('.warning_msg').remove();
              $(el).append('<i class="warning_msg">'+ msg +'</i>');

              if(showGraph){
//              intentionally leave as is - because list is dynamically generated
                var li = $(el).closest('li').find('.graph_link');
                this.closeModal();
                var inventoryYear = $(li).attr('data-inventoryYear');
                var inventoryNo = $(li).attr('data-inventoryNo');
                var year = $(li).attr('data-year');
                var carname = $(li).attr('data-carname');
                var mileage = $(li).attr('data-mileage');
                this.drawChart(inventoryYear, inventoryNo, year, carname, mileage);
                this.graphModal();
              }
            },

//          intentionally leave as is (find and class) - because list is dynamically generated
            /**
             * Checks all items inputs
             */
            checkInputs : function(){
              var self = this;
              $('#exhibit_list li:not(.disabled) #price_setup').each(function(){
//              intentionally leave as is - because list is dynamically generated
                var itigekiYen = $(this).find('input#itigekiYen:enabled');
//              intentionally leave as is - because list is dynamically generated
                var uriYen = $(this).find('input#uriYen:enabled');
//              intentionally leave as is - because list is dynamically generated
                var startYen = $(this).find('input#startYen:enabled');

                self.checkInput(itigekiYen, false);
                self.checkInput(uriYen, false);
                self.checkInput(startYen, false);
              });
            },


            /**
             * Search event
             * @param context
             * @param $el
             */
            '#exhibit_modal #search click' : function(context, $el) {
              if($el.hasClass('clicked')){
                return;
              }
              $el.addClass('clicked');
              var self = this;
              this.exhibitWarning(function(res){
                if(res){
                  self.exhibitSearch($el);
                }
              });
            },

//          intentionally leave as is (find and class) - because balloon is dynamically generated
            /**
             * Search
             */
            exhibitSearch : function($el){
              var logic = this.exhibitSysLogic;
              // validate
              var torokuDayFrom = null;
              var torokuDayFrom_year = $('#exhibit_modal #torokuDayFrom_year').val();
              var torokuDayFrom_month = $('#exhibit_modal #torokuDayFrom_month').val();
              var torokuDayFrom_day = $('#exhibit_modal #torokuDayFrom_day').val();
              var torokuDayTo = null;
              var torokuDayTo_year = $('#exhibit_modal #torokuDayTo_year').val();
              var torokuDayTo_month = $('#exhibit_modal #torokuDayTo_month').val();
              var torokuDayTo_day = $('#exhibit_modal #torokuDayTo_day').val();

//            intentionally leave as is - because balloon is dynamically generated
              $('#exhibit_modal #torokuDayFrom_year').parent().removeClass('error')
                .find('.error_msg').remove();
//            intentionally leave as is - because balloon is dynamically generated
              $('#exhibit_modal #torokuDayFrom_month').parent().removeClass('error')
                .find('.error_msg').remove();
//            intentionally leave as is - because balloon is dynamically generated
              $('#exhibit_modal #torokuDayTo_year').parent().removeClass('error')
                .find('.error_msg').remove();
//            intentionally leave as is - because balloon is dynamically generated
              $('#exhibit_modal #torokuDayTo_month').parent().removeClass('error')
                .find('.error_msg').remove();

              if(logic.isEmpty(torokuDayFrom_year) && logic.isEmpty(torokuDayFrom_month) && logic.isEmpty(torokuDayFrom_day)){
                torokuDayFrom = null;
              }
              else if((!logic.isEmpty(torokuDayFrom_year) && !logic.isEmpty(torokuDayFrom_month) && !logic.isEmpty(torokuDayFrom_day))
                  || (!logic.isEmpty(torokuDayFrom_year) && !logic.isEmpty(torokuDayFrom_month) && logic.isEmpty(torokuDayFrom_day))
                  || (!logic.isEmpty(torokuDayFrom_year) && logic.isEmpty(torokuDayFrom_month)  && logic.isEmpty(torokuDayFrom_day))){
                torokuDayFrom = logic.pad(torokuDayFrom_year,2,'0') + logic.pad(torokuDayFrom_month,2,'0') + logic.pad(torokuDayFrom_day,2,'0');
              }
              else {

                if(!logic.isEmpty(torokuDayFrom_year) && logic.isEmpty(torokuDayFrom_month) && !logic.isEmpty(torokuDayFrom_day)){
                  $('#exhibit_modal #torokuDayFrom_month').parent().addClass('error')
                    .append('<i class="error_msg">' + this.__msg.MSGC0027 + '</i>');
                }
                else {
                  $('#exhibit_modal #torokuDayFrom_year').parent().addClass('error')
                    .append('<i class="error_msg">' + this.__msg.MSGC0026 + '</i>');
                }
                return;
              }

              if(logic.isEmpty(torokuDayTo_year) && logic.isEmpty(torokuDayTo_month) && logic.isEmpty(torokuDayTo_day)){
                torokuDayTo = null;
              }
              else if((!logic.isEmpty(torokuDayTo_year) && !logic.isEmpty(torokuDayTo_month) && !logic.isEmpty(torokuDayTo_day))
                  || (!logic.isEmpty(torokuDayTo_year) && !logic.isEmpty(torokuDayTo_month) && logic.isEmpty(torokuDayTo_day))
                  || (!logic.isEmpty(torokuDayTo_year) && logic.isEmpty(torokuDayTo_month)  && logic.isEmpty(torokuDayTo_day))){
                torokuDayTo = logic.pad(torokuDayTo_year,2,'0') + logic.pad(torokuDayTo_month,2,'0') + logic.pad(torokuDayTo_day,2,'0');
              }
              else {
                if(!logic.isEmpty(torokuDayTo_year) && logic.isEmpty(torokuDayTo_month) && !logic.isEmpty(torokuDayTo_day)){
                  $('#exhibit_modal #torokuDayTo_month').parent().addClass('error')
                    .append('<i class="error_msg">' + this.__msg.MSGC0027 + '</i>');
                }
                else {
                  $('#exhibit_modal #torokuDayTo_year').parent().addClass('error')
                    .append('<i class="error_msg">' + this.__msg.MSGC0026 + '</i>');
                }
                return;
              }

              var temp = {};
              temp.kyotenNm = $('#exhibit_search_table #kyotenNm').val(); // select
              temp.maker = $('#exhibit_search_table #maker').val(); // select
              temp.managementNoFrom = $('#exhibit_search_table #managementNoFrom').val(); // input
              temp.managementNoTo = $('#exhibit_search_table #managementNoTo').val(); // input
              temp.carname = $('#exhibit_search_table #carname').val(); // select
              temp.inventoryNoFROM = $('#exhibit_search_table #inventoryNoFROM').val(); // input
              temp.inventoryNoTO = $('#exhibit_search_table #inventoryNoTO').val(); // input
              temp.carBodyNo = $('#exhibit_search_table #carBodyNo').val(); // input
              temp.torokuDayFrom = torokuDayFrom; // input
              temp.torokuDayTo = torokuDayTo; // input
              temp.openClass = $('#exhibit_search_table #openClass').val(); // select
              temp.releaseClass = $('#exhibit_search_table #releaseClass').val(); // select
              temp.keikaDayFrom = $('#exhibit_search_table #keikaDayFrom').val(); // input
              temp.keikaDayTo = $('#exhibit_search_table #keikaDayTo').val(); // input
              temp.kensa = $('#exhibit_search_table #kensa').val(); // select
              temp.inventory4keta = $('#exhibit_search_table #inventory4keta').val(); // input
              temp.kensaKeikaFrom = $('#exhibit_search_table #kensaKeikaFrom').val(); // input
              temp.kensaKeikaTo = $('#exhibit_search_table #kensaKeikaTo').val(); // input
              temp.syupinKeisaiFlg = $('#exhibit_search_table #syupinKeisaiFlg').val(); // select
              temp.syupinKeisaiStatus = $('#exhibit_search_table #syupinKeisaiStatus').val(); // select
              temp.sinkokuFlg = $('#exhibit_search_table #sinkokuFlg').val(); // select
              temp.recommendFlg = $('#exhibit_search_table #recommendFlg').val(); // select
              temp.hyakuretuSyupinFlg = $('#exhibit_search_table #hyakuretuSyupinFlg').val(); // select
              temp.syupinKanouFlg = $('#exhibit_search_table #syupinKanouFlg').val(); // select

              var data = {};
              for(var i in temp){
                data[i] = temp[i] || '';
              }

              data.pageOffset = this.__pageOffset;
              data.pageMaxNo = this.__pageMaxNo || sys.config.PAGE_HYOUJI_DEFA;
              data.sortKey = this.__sortKey || '';
              data.sortOrder = this.__sortOrder || '';

              this.__searchConditions = data;

              temp.torokuDayFrom_year = torokuDayFrom_year;
              temp.torokuDayFrom_month = torokuDayFrom_month;
              temp.torokuDayFrom_day = torokuDayFrom_day;
              temp.torokuDayTo_year = torokuDayTo_year;
              temp.torokuDayTo_month = torokuDayTo_month;
              temp.torokuDayTo_day = torokuDayTo_day;

              h5.api.storage.session.removeItem('exhibitSettingsSearch');
              h5.api.storage.session.setItem('exhibitSettingsSearch', JSON.stringify(temp));

              var self = this;
              var dfd = this.deferred();

              var timeout = sys.common.showLoading('main_sand_loader', 'wrapper');
              this.exhibitSysLogic.syupinKensaku(data)
              .done(function(res){
                self.modelKensaku = res.data;
                self.__pageRecordCount = self.modelKensaku.get('syaryoSummary').carSelected;
                self.__pageCurrent = 1;
                self.exhibitHeader();
                self.pagination();
                self.setItemList();
                self.closeModal();
                $('#search_btn').removeClass('active');
                sys.common.hideLoading(timeout,'main_sand_loader');
                $el.removeClass('clicked');
                dfd.resolve();
              }).fail(function(){
                sys.common.hideLoading(timeout,'main_sand_loader');
              });

              return dfd.promise();
            },


//          intentionally leave as is (find and class) - click event
            /**
             * Registration
             */
            '#registration_btn:not(:disabled) click' : function(){
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              this.closeModal();
              this.checkInputs();
              this.showErrorMessages = true;
              this.setWarning(true);

//            intentionally leave as is - because list is dynamically generated
              if($('#exhibit_list li:not(.disabled) #price_setup span.error').length > 0){
                return;
              }

              var willExhibit = 0;
              var wontExhibit = 0;

              $('#item_list li #col6').each(function(){
                var s = $(this).attr('data-set');
                var dataset = s.split(',');

                // syupinEnaFlg
                if(dataset[0] == 1){
                  // syupinFlg
//                intentionally leave as is - because list is dynamically generated
                  var radio = $(this).find('.checked input[type=radio]').val();
                  if(radio != 'undefined' && radio != dataset[1]){
                    // with changes
                    if(radio == 1){
                      willExhibit++;
                    }
                    else if(radio == 0){
                      wontExhibit++;
                    }
                  }
                }
              });

              var dfd = this.deferred();
              var data = {
                  data : {
                    willExhibit : willExhibit,
                    wontExhibit : wontExhibit
                  },
                  lang : this.__lang,
                  logic : this.exhibitSysLogic
              };
              this.changeView(this, dfd, '#exhibit_modal', this.__page+'_batch_confirmation', data, false);

              this.registrationModal();
            },

            /**
             * Batch registration event
             * @param context
             * @param $el
             */
            '#exhibit_modal #registration_modal_yes click' : function(context, $el) {
              if($el.hasClass('clicked')){
                return;
              }
              $el.addClass('clicked');
              this.registrationBatch($el);
            },

//          intentionally leave as is (find and class) - because list is dynamically generated
            /**
             * Batch registration
             */
            registrationBatch : function($el){
              var self = this;
              var dfd = this.deferred();
              var data = {};
              data.syupinList = [];
              var disabledData = [];
              $('#item_list li #col6').each(function(){
                var s = $(this).attr('data-set');
                var dataset = s.split(',');

                // syupinEnaFlg
                if(dataset[0] == 1){
                  // syupinFlg
//                intentionally leave as is - because list is dynamically generated
                  var radio = $(this).find('.checked input[type=radio]').val();
                  if(radio != 'undefined' && radio != dataset[1]){

                    disabledData.push($(this));

                    var arr = {};
                    arr.inventoryYear = $(this).parent().attr('data-inventoryYear');
                    arr.inventoryNo = $(this).parent().attr('data-inventoryNo');

                    // C:登録(register)、D:出品取り消し(exhibit cancel)
                    if(radio == 1){
//                    intentionally leave as is - because list is dynamically generated
                      arr.startYen = self.exhibitSysLogic.requestYen(
                          $(this).find('input#startYen').val(),
                          $(this).find('input#startYenDec').val()
                        );
//                    intentionally leave as is - because list is dynamically generated
                      arr.uriYen = self.exhibitSysLogic.requestYen(
                                        $(this).find('input#uriYen').val(),
                                        $(this).find('input#uriYenDec').val()
                                      );
//                    intentionally leave as is - because list is dynamically generated
                      arr.itigekiYen = self.exhibitSysLogic.requestYen(
                                        $(this).find('input#itigekiYen').val(),
                                        $(this).find('input#itigekiYenDec').val()
                                      );
                      arr.syoriKbn = 'C';
                    }
                    else if(radio == 0){
                      arr.syoriKbn = 'D';
                    }
                    data.syupinList.push(arr);
                  }
                }
              });

              var timeout = sys.common.showLoading('main_sand_loader', 'wrapper');
              this.exhibitSysLogic.syupinKakutei(data)
              .done(function(res){
                $('#exhibit_modal').empty();
                var model = res.data;
                var data = {
                    numOK: model.get('numOK'),
                    numErr: model.get('numErr'),
                    list : model.get('resultDetailList'),
                    lang : self.__lang,
                    logic : self.exhibitSysLogic
                };
                self.changeView(self, dfd, '#exhibit_modal', self.__page+'_batch_result', data, false);

                for(var i=0; i<disabledData.length; i++){
                  var s = $(disabledData[i]).attr('data-set');
                  var dataset = s.split(',');

                  // syupinFlg
//                intentionally leave as is - because list is dynamically generated
                  dataset[1] = $(disabledData[i]).find('.action_bar .checked input[type=radio]').val();
//                intentionally leave as is - because list is dynamically generated
                  $(disabledData[i]).attr('data-set', dataset.toString())
                                    .find('input[type=tel]')
                                    .prop('disabled', true);
                }
                self.updateItemListApi();
                sys.common.hideLoading(timeout,'main_sand_loader');
                $el.removeClass('clicked');
                dfd.resolve();
              }).fail(function(){
                sys.common.hideLoading(timeout,'main_sand_loader');
              });

              this.setWarning(false);
              return dfd.promise();
            },

            /**
             * Open Exhibit search modal
             * @returns
             */
            '#search_btn click' : function() {
              // check if modal screen is currently displayed
              if($('#exhibit_modal').css('display') != 'none'){
                return; // ignore
              }
              if(!$('#search_btn').hasClass('active')){
                $('#search_btn').addClass('active');
              }
              else {
                return; // already active
              }
              this.closeModal();

              var self = this;
              var dfd = this.deferred();
              var timeout = sys.common.showLoading('main_sand_loader', 'wrapper');
              this.exhibitSysLogic.syupinSyokiKensaku({})
              .done(function(res){
                self.modelSyokiKensaku = res.data;

                var postInfoList = self.modelSyokiKensaku.get('postInfoList');
                var postInfoStatusList = postInfoList[0].get('postStatus2InfoList');
                var data = {
                    kyotenList         : self.modelSyokiKensaku.get('kyotenList'),
                    makerList          : self.modelSyokiKensaku.get('makerList'),
                    postInfoList       : self.modelSyokiKensaku.get('postInfoList'),
                    postInfoStatusList : postInfoStatusList,
                    kyouyuu_kbn        : sys.config.KYOUYUU_KBN,
                    koukai             : sys.config.KOUKAI,
                    ais_kensai         : sys.config.AIS_KENSAI,
                    jiko_sinkokui      : sys.config.JIKO_SINKOKUI,
                    rekomendo_umu      : sys.config.REKOMENDO_UMU,
                    hyakuretu_syu_sumi : sys.config.HYAKURETU_SYU_SUMI,
                    syupin_kanou       : sys.config.SYUPIN_KANOU,
                    lang               : self.__lang
                };

                self.changeView(self, dfd, '#exhibit_modal', self.__page+'_search', data, false);

                var temp = JSON.parse(h5.api.storage.session.getItem('exhibitSettingsSearch'));

                if(temp != null){
                  for(var i in temp){
                    $('#exhibit_search_table #' + i).val(temp[i]);
                  }

                  self.fillCarList(temp.maker);
                  $('#carname').val(temp.carname);

                  self.fillStatus2InfoList(temp.syupinKeisaiFlg);
                  $('#syupinKeisaiStatus').val(temp.syupinKeisaiStatus);
                }

                sys.common.hideLoading(timeout,'main_sand_loader');
                dfd.resolve();
              }).fail(function(){
                sys.common.hideLoading(timeout,'main_sand_loader');
              });

              this.searchModal();
              return dfd.promise();
            },

//          intentionally leave as is (find and class) - because list is dynamically generated
            /**
             * Exhibit search modal numeric input keydown event
             * Validate keys
             */
            '#exhibit_modal input.numeric keydown' : function(context, $el){
              var e = context.event;
              if(sys.common.numericOnly(context)){
                return;
              }
              e.preventDefault();
            },
            /**
             * Exhibit search modal Post Info List combobox change event
             * Fill Post Info Status List combobox base on this value
             * @param context
             * @param $el
             */
            '#syupinKeisaiFlg change' : function(context, $el){
              this.fillStatus2InfoList($el.val());
            },
            /**
             * Exhibit search modal Maker combobox change event
             * Fill Car List combobox base on this value
             * @param context
             * @param $el
             */
            '#maker change' : function(context, $el){
              this.fillCarList($el.val());
            },


//          intentionally leave as is (find and class) - because list is dynamically generated
            /**
             * Exhibit list item radio button change event
             */
            '#exhibit_list ul li input:radio change' : function(context, $el) {
              if($el.parent().hasClass('checked')){
                return;
              }
              this.setWarning(true);
              var closest = $el.closest('.action_bar');
//            intentionally leave as is - because list is dynamically generated
              $(closest).find('.checked').removeClass('checked');
              if($el.is(':checked')){
                $el.parent().addClass('checked');
              }

              var s = $(closest).parent().attr('data-set');
              var dataset = s.split(',');
              // syupinFlg
              if(dataset[1] == 0){
                var bool = ($el.val() == 1 || $el.val() == '1');
//              intentionally leave as is - because list is dynamically generated
                $(closest).parent()
                  .find('#price_setup')
                  .find('input[type=tel]')
                  .prop('disabled', !bool);
              }

//            intentionally leave as is - because list is dynamically generated
              $(closest).parent()
                .find('#price_setup span.error')
                .removeClass('error')
                .find('.error_msg').remove();

//            intentionally leave as is - because list is dynamically generated
              $(closest).parent()
                .find('#price_setup span.warning')
                .removeClass('warning')
                .find('.warning_msg').remove();

              if($el.val() == 1){
                $el.closest('li').removeClass('disabled');
              }
              else {
                $el.closest('li').addClass('disabled');
              }
              this.checkChanges();
            },

            /**
             * initialize syupin kensaku request params
             */
            getSyupinKensakuReqParam : function(mode){
              var param = {};
              param.kyotenNm = '';
              param.maker = '';
              param.managementNoFrom = '';
              param.managementNoTo = '';
              param.carname = '';
              param.inventoryNoFROM = '';
              param.inventoryNoTO = '';
              param.carBodyNo = '';
              param.torokuDayFrom = '';
              param.torokuDayTo = '';
              param.openClass = '';
              param.releaseClass = '';
              param.keikaDayFrom = '';
              param.keikaDayTo = '';
              param.kensa = '';
              param.inventory4keta = '';
              param.kensaKeikaFrom = '';
              param.kensaKeikaTo = '';
              param.syupinKeisaiFlg = '';
              param.syupinKeisaiStatus = '';
              param.sinkokuFlg = '';
              param.recommendFlg = '';
              param.hyakuretuSyupinFlg = '';
              param.syupinKanouFlg = '';
              param.pageOffset = this.__pageOffset;
              param.pageMaxNo = this.__pageMaxNo || sys.config.PAGE_HYOUJI_DEFA;
              param.sortKey = this.__sortKey || '';
              param.sortOrder = this.__sortOrder || '';
              this.__searchConditions = param;
              return param;
            }
          });

  h5.ui.jqm.manager.define(
      'exhibit',
      null,
      exhibitController);
});