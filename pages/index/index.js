const store = require('../../utils/store');
Page({
  data: {
    previewMode:typeof window!=='undefined',tab:'home',category:'全部',
    categories:['全部','千层蛋糕','毛巾卷','饱饱碗','整只蛋糕'],sheet:'',admin:false,
    phone:'',note:'',payment:'wechat',selectedCoupon:'',useBirthday:false,
    mode:'pickup',modeText:'到店自提',table:'',address:'',receiver:'',couponFilter:'valid',couponDetail:{},adminSection:'orders',memberSearch:'',newMemberName:'',newMemberPhone:'',couponTitle:'',couponAmount:'',couponMinimum:'',couponDays:'90',couponTarget:'all',marketingKind:'fullReduction',activityMinimum:'',activityAmount:'',deliveryFeeInput:'',deliveryMinimumInput:'',deliveryAreaInput:'',dealName:'',dealPrice:'',dealStock:'',dealDays:'',dealFirst:'mango',dealSecond:'roll',dealFirstIndex:0,dealSecondIndex:3,dealFirstQty:'1',dealSecondQty:'1',codeInput:'',codeOrder:null,tierInputs:[],
    selectedRecharge:100,birthInput:'',message:'',date:'',time:'',dates:[],times:[],dateIndex:0,timeIndex:0,
    orderFilter:'all',orderFilters:[{id:'all',label:'全部'},{id:'paid',label:'待完成'},{id:'completed',label:'已完成'},{id:'cancelled',label:'已取消'}],
    splash:false,splashLeaving:false,splashPlayed:false,detail:{},search:'',posterIndex:0,
    posters:[
      {id:'mango',image:'poster-mango',label:'招牌芒果',kicker:'招牌精选 / 01',titleTop:'一层芒果',titleBottom:'一层喜欢',caption:'芒果果肉 × 细薄饼皮',tone:'mango'},
      {id:'strawberry',image:'poster-strawberry',label:'草莓云朵',kicker:'果香精选 / 02',titleTop:'把草莓',titleBottom:'叠成云朵',caption:'草莓果香 × 轻盈奶油',tone:'strawberry'}
    ],
    rechargeOptions:[{amount:100,total:110,count:1},{amount:200,total:220,count:2},{amount:500,total:550,count:5}]
  },
  onLoad(){this.refresh();this.playSplash();},
  onShow(){this.refresh();},
  refresh(){
    const state=store.snapshot(),dates=store.availableDates();
    const date=this.data.mode==='dinein'?store.dateString(new Date()):(dates.includes(this.data.date)?this.data.date:dates[1]);
    const times=store.slots(date),time=times.includes(this.data.time)?this.data.time:(times[0]||'');
    let q;
    try{q=store.quote({date,couponId:this.data.selectedCoupon,birthday:this.data.useBirthday});}
    catch(e){this.setData({selectedCoupon:'',useBirthday:false});q=store.quote({date});}
    const search=this.data.search.trim().toLowerCase();
    const visibleProducts=state.products.filter(p=>(this.data.category==='全部'||p.cat===this.data.category)&&(!search||[p.name,p.cat,p.flavor,p.ingredients].join(' ').toLowerCase().includes(search)));
    const detailProduct=state.products.find(p=>p.id===this.data.detail.id);
    const posterInfo=this.data.posters[this.data.posterIndex]||this.data.posters[0];
    const posterProduct=state.products.find(p=>p.id===posterInfo.id);
    const featuredIds=['mango','durian','taro','matcha-roll','mango-bowl','strawberry-whole'];
    this.setData({
      ...state,levelTrackStyle:'width:'+state.progress+'%;',productNames:state.products.map(p=>p.name),birthdayMonth:state.birthday.slice(5),visibleProducts,featured:featuredIds.map(id=>state.products.find(p=>p.id===id)).filter(p=>p&&!p.off),poster:{...posterProduct,...posterInfo},
      dates,date,dateIndex:dates.indexOf(date),times,time,timeIndex:Math.max(0,times.indexOf(time)),
      quoteTotal:store.money(q.total+(this.data.mode==='delivery'&&state.settings.delivery?state.settings.delivery.fee:0)),deliveryFeeText:store.money(state.settings.delivery?state.settings.delivery.fee:0),quoteFree:q.total===0&&!(this.data.mode==='delivery'&&state.settings.delivery&&state.settings.delivery.fee),quoteSaving:store.money(q.saving),quoteLabel:q.discountLabel,quotePoints:q.points,
      quoteCoupon:q.couponId||'',quoteBirthday:!!q.birthdayYear,selectedCoupon:q.couponId||'',useBirthday:!!q.birthdayYear,
      validCoupons:state.coupons.filter(c=>c.valid&&(c.kind==='cash'?q.subtotal>=(c.minimum||0):state.cart.some(p=>p.id===c.product))),displayCoupons:state.coupons.filter(c=>this.data.couponFilter==='valid'?c.valid:!c.valid),memberResults:state.members.filter(m=>!this.data.memberSearch||m.name.includes(this.data.memberSearch)||m.phone.includes(this.data.memberSearch)),modeText:{pickup:'到店自提',dinein:'堂食',delivery:'外卖配送'}[this.data.mode],activePromotions:Object.keys(state.settings.marketing||{}).map(k=>({kind:k,name:k==='newcomer'?'新人首单礼':'满减活动',label:'满 ¥'+store.money(state.settings.marketing[k].minimum)+' 减 ¥'+store.money(state.settings.marketing[k].amount)})),
      today:store.dateString(new Date()),displayOrders:(this.data.tab==='admin'?state.allOrders:state.orders).filter(o=>this.data.orderFilter==='all'||o.status===this.data.orderFilter),
      paidCount:state.orders.filter(o=>o.status==='paid').length,
      birthdayAvailable:!!state.birthdayPolicy&&!!state.birthday&&state.birthday.slice(5)===date.slice(5)&&!state.birthdayYears.includes(date.slice(0,4))&&state.cart.some(p=>p.point),
      detail:detailProduct?{...detailProduct,leadText:'至少提前 '+(detailProduct.lead/60)+' 小时预约',pointText:detailProduct.point?'购买 1 份可集 1 点，订单完成后到账':'本商品不参与千层集点'}:this.data.detail
    });
  },
  act(fn){try{fn();this.refresh();}catch(e){this.notify(e.message);}},
  notify(message){this.setData({message});clearTimeout(this.msgTimer);this.msgTimer=setTimeout(()=>this.setData({message:''}),3000);},
  nav(e){clearTimeout(this.msgTimer);this.setData({tab:e.currentTarget.dataset.tab,sheet:'',message:''});if(typeof wx!=='undefined')wx.pageScrollTo({scrollTop:0,duration:0});this.refresh();},
  categoryTap(e){this.setData({category:e.currentTarget.dataset.category});this.refresh();},
  posterTap(e){const index=Number(e.currentTarget.dataset.index);if(Number.isInteger(index)&&this.data.posters[index]){this.setData({posterIndex:index});this.refresh();}},
  clearSearch(){this.setData({search:'',category:'全部'});this.refresh();},
  filterOrder(e){this.setData({orderFilter:e.currentTarget.dataset.filter});this.refresh();},
  add(e){this.act(()=>store.add(e.currentTarget.dataset.id,1));},
  minus(e){this.act(()=>{store.add(e.currentTarget.dataset.id,-1);if(!store.snapshot().count&&this.data.sheet==='checkout'){this.setData({sheet:''});this.notify('购物袋已清空');}});},
  product(e){this.setData({detail:{id:e.currentTarget.dataset.id},sheet:'product'});this.refresh();},
  addDetail(){this.act(()=>{store.add(this.data.detail.id,1);this.setData({sheet:''});this.notify('已加入购物袋');});},
  open(e){clearTimeout(this.msgTimer);this.setData({message:''});const sheet=e.currentTarget.dataset.sheet;if(sheet==='checkout'&&!store.snapshot().count)return this.notify('先挑选喜欢的甜品吧');this.setData({sheet});this.refresh();},
  close(){this.setData({sheet:''});},
  noop(){},
  dateChange(e){this.setData({date:this.data.dates[Number(e.detail.value)],time:'',selectedCoupon:'',useBirthday:false});this.refresh();},
  timeChange(e){this.setData({time:this.data.times[Number(e.detail.value)]});this.refresh();},
  input(e){this.setData({[e.currentTarget.dataset.field]:e.detail.value});if(e.currentTarget.dataset.field==='codeInput')this.setData({codeOrder:null});if(['search','memberSearch'].includes(e.currentTarget.dataset.field))this.refresh();},
  paymentTap(e){this.setData({payment:e.currentTarget.dataset.payment});},
  couponTap(e){
    const id=e.currentTarget.dataset.id;
    if(this.data.selectedCoupon===id){this.setData({selectedCoupon:''});return this.refresh();}
    this.act(()=>{const q=store.quote({date:this.data.date,couponId:id});if(q.couponId!==id){this.setData({selectedCoupon:'',useBirthday:false});return this.notify('其他优惠更划算，本次保留兑换券');}this.setData({selectedCoupon:id,useBirthday:false});});
  },
  birthdayTap(){
    if(this.data.useBirthday){this.setData({useBirthday:false});return this.refresh();}
    this.act(()=>{const q=store.quote({date:this.data.date,birthday:true});if(!q.birthdayYear)return this.notify('其他优惠更划算，本次保留生日权益');this.setData({useBirthday:true,selectedCoupon:''});});
  },
  rechargeSelect(e){this.setData({selectedRecharge:Number(e.currentTarget.dataset.amount)});},
  recharge(){this.act(()=>{store.recharge(this.data.selectedRecharge);this.setData({sheet:''});this.notify('演示充值成功，赠品券已放入卡包');});},
  birthChange(e){this.setData({birthInput:e.detail.value});},
  saveBirthday(){this.act(()=>{store.birthday(this.data.birthInput);this.setData({sheet:''});this.notify('生日已保存');});},
  redeem(e){this.act(()=>{const id=e.currentTarget.dataset.product;const s=store.snapshot();const c=s.coupons.find(x=>x.id===e.currentTarget.dataset.id);if(!c||!c.valid)throw Error('优惠券不可用');if(c.kind==='cash'&&!s.cart.length){this.setData({tab:'menu',sheet:'',selectedCoupon:c.id});this.notify('先挑选甜品，结算时可选用此券');return;}if(c.kind!=='cash'&&!s.cart.some(p=>p.id===id))store.add(id,1);this.setData({selectedCoupon:e.currentTarget.dataset.id,useBirthday:false,sheet:'checkout'});});},
  submit(){this.act(()=>{store.checkout({mode:this.data.mode,table:this.data.table,address:this.data.address,receiver:this.data.receiver,date:this.data.date,time:this.data.time,phone:this.data.phone,note:this.data.note,payment:this.data.payment,couponId:this.data.selectedCoupon,birthday:this.data.useBirthday});this.setData({sheet:'',tab:'orders',orderFilter:'all',selectedCoupon:'',useBirthday:false,note:''});if(typeof wx!=='undefined')wx.pageScrollTo({scrollTop:0,duration:0});this.notify(this.data.mode==='delivery'?'演示下单成功，等待配送':'演示下单成功，请查看订单');});},
  playSplash(){
    if(this.data.splashPlayed)return;
    this.setData({splash:true,splashLeaving:false,splashPlayed:true});
    this.splashTimer=setTimeout(()=>this.skipSplash(),2100);
  },
  replaySplash(){clearTimeout(this.splashTimer);clearTimeout(this.splashExitTimer);this.setData({splashPlayed:false});this.playSplash();},
  skipSplash(){clearTimeout(this.splashTimer);if(!this.data.splash||this.data.splashLeaving)return;this.setData({splashLeaving:true});this.splashExitTimer=setTimeout(()=>this.setData({splash:false,splashLeaving:false}),260);},
  enterAdmin(){this.setData({admin:true,tab:'admin',sheet:'',orderFilter:'all'});this.refresh();if(typeof wx!=='undefined')wx.pageScrollTo({scrollTop:0,duration:0});else if(typeof window!=='undefined')window.scrollTo(0,0);},
  guard(){if(!this.data.admin){this.setData({tab:'home'});this.notify('请先进入商家演示模式');return false;}return true;},
  complete(e){if(this.guard())this.act(()=>{store.complete(e.currentTarget.dataset.id);this.notify('核销成功，消费与集点已到账');});},
  cancel(e){if(this.guard())this.act(()=>{store.cancel(e.currentTarget.dataset.id);this.notify('已取消，余额及优惠权益已退回');});},
  toggle(e){if(this.guard())this.act(()=>store.toggle(e.currentTarget.dataset.id));},
  capacityChange(e){if(this.guard())this.act(()=>store.capacity(Number(e.detail.value)));},

  checkoutMode(e){this.setData({mode:e.currentTarget.dataset.mode});this.refresh();},
  modeTap(e){const mode=e.currentTarget.dataset.mode;this.setData({mode,tab:'menu',sheet:''});this.refresh();if(typeof wx!=='undefined')wx.pageScrollTo({scrollTop:0,duration:0});},
  couponFilterTap(e){this.setData({couponFilter:e.currentTarget.dataset.filter});this.refresh();},
  couponRules(e){const c=this.data.coupons.find(c=>c.id===e.currentTarget.dataset.id);if(c)this.setData({couponDetail:c,sheet:'couponRules'});},
  adminTab(e){if(!this.guard())return;this.setData({adminSection:e.currentTarget.dataset.section});this.refresh();},
  enrollMember(){if(this.guard())this.act(()=>{store.enroll(this.data.newMemberName,this.data.newMemberPhone);this.setData({newMemberName:'',newMemberPhone:''});this.notify('会员已录入本地演示');});},
  simulateMember(e){if(this.guard())this.act(()=>{store.switchMember(e.currentTarget.dataset.id);this.setData({tab:'mine',sheet:'',selectedCoupon:'',useBirthday:false,phone:'',note:'',table:'',address:'',receiver:'',codeOrder:null});this.notify('已切换演示会员');});},
  targetMember(e){if(this.guard())this.setData({couponTarget:e.currentTarget.dataset.id});},
  sendCoupons(){if(this.guard())this.act(()=>{const count=store.issueCampaign({title:this.data.couponTitle,amount:this.data.couponAmount,minimum:this.data.couponMinimum,days:this.data.couponDays,target:this.data.couponTarget});this.notify('已向 '+count+' 位演示会员发券');});},
  activityKind(e){if(this.guard())this.setData({marketingKind:e.currentTarget.dataset.kind});},
  saveActivity(){if(this.guard())this.act(()=>{store.configureMarketing(this.data.marketingKind,{minimum:this.data.activityMinimum,amount:this.data.activityAmount});this.notify('演示活动已启用');});},
  disableActivity(e){if(this.guard())this.act(()=>{store.configureMarketing(e.currentTarget.dataset.kind,{enabled:false});this.notify('活动已关闭');});},
  saveDelivery(){if(this.guard())this.act(()=>{store.configureDelivery({fee:this.data.deliveryFeeInput,minimum:this.data.deliveryMinimumInput,area:this.data.deliveryAreaInput});this.notify('演示配送规则已保存');});},
  setBirthdayPolicy(e){if(this.guard())this.act(()=>{store.configureBirthday(e.currentTarget.dataset.policy);this.notify('生日适用范围已设置');});},
  editTiers(){if(!this.guard())return;this.setData({sheet:'tierEditor',tierInputs:this.data.tierRules.map((t,i)=>({name:t.name,threshold:t.threshold===null?'':String(t.threshold/100),rate:this.data.rulesConfigured?String(t.rate):'',index:i}))});},
  tierInput(e){if(!this.guard())return;const list=this.data.tierInputs.map(x=>({...x}));list[Number(e.currentTarget.dataset.index)][e.currentTarget.dataset.key]=e.detail.value;this.setData({tierInputs:list});},
  saveTiers(){if(this.guard())this.act(()=>{if(this.data.tierInputs.some(t=>t.threshold===''||t.rate===''))throw Error('请填写完整五级门槛和折扣比例');store.configureTiers(this.data.tierInputs);this.setData({sheet:''});this.notify('五级会员规则已保存');});},
  dealProductChange(e){if(!this.guard())return;this.setData({[e.currentTarget.dataset.field]:this.data.products[Number(e.detail.value)].id,[e.currentTarget.dataset.field+'Index']:Number(e.detail.value)});},
  publishDeal(){if(this.guard())this.act(()=>{store.publishDeal({name:this.data.dealName,price:this.data.dealPrice,stock:this.data.dealStock,days:this.data.dealDays,items:[{id:this.data.dealFirst,qty:this.data.dealFirstQty},{id:this.data.dealSecond,qty:this.data.dealSecondQty}]});this.notify('演示团购套餐已上架');});},
  viewDeal(e){const deal=this.data.deals.find(d=>d.id===e.currentTarget.dataset.id);if(deal)this.setData({sheet:'deal',selectedDeal:deal,payment:'wechat'});},
  purchaseDeal(){this.act(()=>{store.buyDeal(this.data.selectedDeal.id,this.data.payment);this.setData({sheet:'',tab:'orders',orderFilter:'all'});this.notify('演示购买成功，团购券码已生成');});},
  findCode(){if(this.guard())this.act(()=>{this.setData({codeOrder:null});this.setData({codeOrder:store.lookupCode(this.data.codeInput)});});},
  confirmCode(){if(this.guard()&&this.data.codeOrder)this.act(()=>{store.complete(this.data.codeOrder.id);this.setData({codeOrder:store.lookupCode(this.data.codeOrder.code)});this.notify('核销完成');});},
  onUnload(){clearTimeout(this.msgTimer);clearTimeout(this.splashTimer);clearTimeout(this.splashExitTimer);}
});
