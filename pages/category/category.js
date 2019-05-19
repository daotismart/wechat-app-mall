// pages/category/category.js

const WXAPI = require('../../wxapi/main')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    hasToken: false,
    categories: [],
    goodsWrap: [],
    categorySelected: "",
    goodsToView: "",
    categoryToView: "",
    hideSummaryPopup: true,
    totalPrice: 0,
    totalScore: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let token = wx.getStorageSync('token');
    if (token) {
      this.setData({
        hasToken: true
      })
    }

    this.initData();
  },
  initData() {

    let that = this;
    wx.showNavigationBarLoading();

    var shopCarInfo = wx.getStorageSync('shopCarInfo');
    var hideSummaryPopup = true;
    if (shopCarInfo.shopList && shopCarInfo.shopList.length > 0) {
      hideSummaryPopup = false;
    }
    that.setData({
      hideSummaryPopup: hideSummaryPopup,
      totalPrice: shopCarInfo.totalPrice,
      totalScore: shopCarInfo.totalScore,
      shopNum: shopCarInfo.shopNum
    });

    WXAPI.goodsCategory().then(function(res) {

      var categories = [];
      if (res.code == 0) {
        for (var i = 0; i < res.data.length; i++) {

          let item = res.data[i];

          item.scrollId = "s" + item.id;
          categories.push(item);

          if (i == 0) {

            that.setData({
              categorySelected: item.scrollId,
            })

          }
        }
      }
      that.setData({
        categories: categories,

      });
      console.log(categories);
      that.getGoodsList(0);
    }).catch((e) => {

      wx.hideNavigationBarLoading();
    });

  },
  getGoodsList: function(categoryId, append) {

    let that = this;

    WXAPI.goods({
      categoryId: "",
      page: 1,
      pageSize: 100000
    }).then(function(res) {
      if (res.code == 404 || res.code == 700) {

        return
      }
      let goodsWrap = [];


      that.data.categories.forEach((o, index) => {

        let wrap = {};
        wrap.id = o.id;
        wrap.scrollId = "s" + o.id;
        wrap.name = o.name;
        let goods = [];

        wrap.goods = goods;

        res.data.forEach((item, i) => {

          if (item.categoryId == wrap.id) {
            item.buyNum = that.getGoodsNumInShopCard(res.data[i].id);
            goods.push(item)
          }
        })

        if(wrap.goods.length>0)goodsWrap.push(wrap);
      })



      that.setData({
        loadingMoreHidden: true,
        goodsWrap: goodsWrap,
      });

      console.log(goodsWrap);

      wx.hideNavigationBarLoading();
    }).catch((e) => {

      wx.hideNavigationBarLoading();
    });
  },
  toDetailsTap: function(e) {
    wx.navigateTo({
      url: "/pages/goods-details/index?id=" + e.currentTarget.dataset.id
    })
  },
  onCategoryClick: function(e) {

    let id = e.currentTarget.dataset.id;
    this.categoryClick = true;
    this.setData({
      goodsToView: id,
      categorySelected: id,
    })

  },
  scroll: function(e) {

    if (this.categoryClick){
      this.categoryClick = false;
      return;
    }

    let scrollTop = e.detail.scrollTop;

    let that = this;

    let offset = 0;
    let isBreak = false;

    for (let g = 0; g < this.data.goodsWrap.length; g++) {

      let goodWrap = this.data.goodsWrap[g];

      offset += 30;

      if (scrollTop <= offset) {

        if (this.data.categoryToView != goodWrap.scrollId) {
          this.setData({
            categorySelected: goodWrap.scrollId,
            categoryToView: goodWrap.scrollId,
          })
        }

        break;
      }


      for (let i = 0; i < goodWrap.goods.length; i++) {

        offset += 91;

        if (scrollTop <= offset) {

          if (this.data.categoryToView != goodWrap.scrollId) {
            this.setData({
              categorySelected: goodWrap.scrollId,
              categoryToView: goodWrap.scrollId,
            })
          }

          isBreak = true;
          break;
        }
      }

      if (isBreak){
        break;
      }


    }

  
  },

  onTotalPriceChange: function (e) {
    let hideSummaryPopup = true;
    if (e.detail.totalPrice > 0) {
      hideSummaryPopup = false;
    }
    this.setData({
      hideSummaryPopup: hideSummaryPopup,
      totalPrice: e.detail.totalPrice,
      totalScore: e.detail.totalScore,
      shopNum: e.detail.shopNum
    });

  },
  getGoodsNumInShopCard: function (goodsId) {
    var shopCarInfo = wx.getStorageSync('shopCarInfo');
    if (shopCarInfo.shopList && shopCarInfo.shopList.length > 0) {
      for (var i = 0; i < shopCarInfo.shopList.length; i++) {
        var tmpShopCarMap = shopCarInfo.shopList[i];
        if (tmpShopCarMap.goodsId == goodsId) {
          return tmpShopCarMap.number;
        }
      }
    }
    return 0;
  },
  navigateToPayOrder: function () {
    wx.hideLoading();
    wx.navigateTo({
      url: "/pages/to-pay-order/index"
    })
  },
  navigateToCartShop: function () {
    wx.hideLoading();
    wx.switchTab({
      url: "/pages/shop-cart/index"
    })
  },

  onShow: function () {
    this.onLoad();
  },
  askPrice: function () {
    wx.showModal({
      title: '询价',
      content: '咨询价格相关请联系我们 http://www.oejia.net/ 商榷，谢谢！',
      showCancel: false
    })
  },
})