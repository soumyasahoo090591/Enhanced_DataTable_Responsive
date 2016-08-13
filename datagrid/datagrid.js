angular.module('test')
    .directive('xeColumnShowHide',['$document', function($document) {
        return {
            restrict:'E',
            scope:{
                header:'=',
                label: '@',
                onSelectAll: '&'
            },
            replace: true,
            templateUrl:'templates/column-filter.html',
            controller :['$scope', function ($scope){
                $scope.selectAll = true;

                $scope.hideColumnSettingMenu = true;

                $scope.hideUnhideColumn = function(heading)
                {
                    heading.options.visible !== heading.options.visible;
                    if(!heading.options.visible) {
                        $scope.selectAll = false;
                    }

                    var temp = true;
                    angular.forEach($scope.header, function(value, key) {
                        if(value.options.visible == false) {
                            temp = false;
                        }
                    });
                    if(temp) {
                        $scope.selectAll = true;
                    }


                };

                $scope.onSelectAll = function(header) {
                    $scope.selectAll = true;
                    angular.forEach(header, function(heading) {
                        heading.options.visible = true;
                    });
                };
            }],
            link :function(scope, elem){
                var hideDropdown = function(){
                    var isClickedElementChildOfPopup = elem
                            .find(event.target)
                            .length > 0;

                    if (isClickedElementChildOfPopup){
                        return;
                    }
                    scope.hideColumnSettingMenu = true;
                    $document.off('click', hideDropdown);
                    scope.$apply();
                };

                scope.bindClickEvent  = function() {
                    scope.hideColumnSettingMenu=!scope.hideColumnSettingMenu;
                    // Bind to the document click event.
                    $document.on('click', hideDropdown);
                };
            }
        };
    }]);

angular.module('test').directive ('xeTableSearch', function() {
    return {
        restrict:'E',
        scope:{
            value:'=',
            isLoading: '=',
            placeHolder: '@',
            onChange: '&',
            onFocus : '&',
            onBlur : '&'
        },
        replace: true,
        templateUrl: 'templates/search.html',
        link :function(scope, element){
            scope.onDataChange = function() {
                scope.onChange({data:scope.value});
            };
            element.bind("keydown", function (event) {
                if(scope.isLoading){
                    event.preventDefault();
                    return;
                }
                var KEY_ENTER = 13;
                if (event && event.which === KEY_ENTER) {
                    angular.element(document.getElementsByClassName("first-row")).focus();
                }
            });
        }
    };
});

angular.module('test').directive('droppable', ['$parse',
    function($parse) {
        return {

            link: function(scope, element, attr) {
                function onDragOver(e) {
                    if (e.preventDefault) {
                        e.preventDefault();
                    }
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    e = e || window.event;
                    var dragX = e.originalEvent.pageX, dragY = e.originalEvent.pageY - 170;

                    angular.element('#dragtable').show();

                    angular.element('#dragtable').css({
                        left:  dragX,
                        top:   dragY
                    });
                    e.originalEvent.dataTransfer.dropEffect = 'move';

                    if (e.preventDefault) {
                        e.preventDefault();
                    };
                    return false;
                }

                function onDrop(event) {
                    angular.element('#dragtable').hide();
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    if (event.stopPropagation) {
                        event.stopPropagation();
                    }

                    var data =  event.originalEvent.dataTransfer.getData("Text");
                    data = angular.fromJson(data);
                    var dropfn = attr.drop;
                    var fn = $parse(attr.drop);

                    var headerElem=angular.element(event.target).closest('th');
                    var textOfHeader=angular.element(headerElem).find("label").attr('name');

                    scope.$apply(function() {
                        scope[dropfn](data, textOfHeader);
                    });
                }
                element.bind("dragover", onDragOver);
                element.bind("drop", onDrop);
            }
        };
    }
]);
angular.module('test').directive('draggable', function() {
    return {
        link: function(scope, elem, attr) {
            var enterTarget = null;
            elem.attr("draggable", true);

            var dragDataVal = '';
            var draggedGhostImgElemId = '';
            attr.$observe('dragdata', function(newVal) {
                dragDataVal = newVal;
            });
            attr.$observe('dragimage', function(newVal) {
                draggedGhostImgElemId = newVal;
            });


            function  dragstart(e){
                angular.element(e.target).addClass('dragged');
                var index = angular.element(e.target).closest('th').index() + 1;
                angular.element( "table td:nth-child("+index+")" ).addClass('dragged');

                var sendData = angular.toJson(dragDataVal);
                e.originalEvent.dataTransfer.setData("text", sendData);
                var dragFn = attr.drag;

                if (dragFn !== 'undefined') {
                    scope.$apply(function() {
                        scope[dragFn](sendData);
                    })
                }
            }

            function dragend(e) {
                angular.element(e.target).removeClass('dragged');
                var index = angular.element(e.target).closest('th').index() + 1;
                angular.element("table td:nth-child("+index+")" ).removeClass('dragged');
                angular.element(".drag-enter").removeClass('drag-enter');
                angular.element('#dragtable').hide();
            }

            function dragenter(e) {
                angular.element(e.target).closest('th').children().first().addClass('drag-enter');
                var index = angular.element(e.target).closest('th').index() + 1;
                angular.element( "table td:nth-child("+index+")" ).addClass('drag-enter');
                enterTarget = e.target;
                e.preventDefault()
            }

            function dragleave(e) {
                if (enterTarget == e.target){
                    angular.element(e.target).closest('th').children().first().removeClass('drag-enter');
                    var index = angular.element(e.target).closest('th').index() + 1;
                    angular.element( "table td:nth-child("+index+")" ).removeClass('drag-enter');
                }
            }

            elem.bind("dragstart", dragstart);
            elem.bind("dragend", dragend);
            elem.bind("dragenter", dragenter);
            elem.bind("dragleave", dragleave);
        }
    };
});

angular.module('test').directive('xeTablePagination', [function() {

    var reassignRange = function(pageNumber, offset) {
        var pageEnd = offset * pageNumber;
        return {
            max: pageEnd,
            offset: pageEnd === 0 ? 0 :(pageEnd - offset)
        };
    };

    return {
        restrict: 'EA',
        replace: true,
        require: "?^xeDataTable",
        scope: true,
        templateUrl: "templates/pagination.html",

        link: function(scope, elem, attributes, parentController) {

            // If continuous scrolling is true then we can to hide paginations across devices and desktop.
            if (parentController.hidePaginationIfContinuousScroll) {
                parentController.hidePaginationIfContinuousScroll();
            }

            // Injecting next(), previous() and sort() function to parent controller so that it can invoke them later as per the need.
            // For example for continuous scrolling.
            parentController.next = function(append) {
                scope.next(append);
            };

            parentController.previous = function(append) {
                scope.prev(append);
            };
        },
        controller: ['$scope', '$attrs', "$timeout","notificationCenterService", function($scope, $attrs, $timeout,notificationCenterService) {
            $scope.firstPrev = $scope.nextLast = false;

            if (!$scope.paginationConfig.pageLengths) {
                $scope.pageOffsets = [10, 20, 50, 100];
            } else {
                $scope.pageOffsets = $scope.paginationConfig.pageLengths;
            }

            if ($scope.paginationConfig.offset) {
                $scope.offset = $scope.paginationConfig.offset;
            } else {
                $scope.offset = $scope.pageOffsets[0];
            }

            if ($scope.pageOffsets.indexOf($scope.offset) < 0) {
                $scope.pageOffsets.push($scope.offset);
                $scope.pageOffsets.sort(function(a, b){return a-b});
            }

            $scope.onPage = 1;
			$scope.oldPageValue = 1;

            var disableButtons = function(pageNumber, numberOfPages) {
                pageNumber = parseInt(pageNumber);
                numberOfPages = parseInt(numberOfPages);
                var reminder = numberOfPages / pageNumber;

                if (numberOfPages === 1) {
                    // Only one page
                    $scope.firstPrev = true;
                    $scope.nextLast = true;
                } else if(reminder === 1) {
                    // On last page
                    $scope.nextLast = true;
                    $scope.firstPrev = false;
                } else if(reminder === numberOfPages) {
                    // On first page
                    $scope.firstPrev = true;
                    $scope.nextLast = false;
                } else if(pageNumber <= 0 || (pageNumber > numberOfPages)) {
                    // Out of range
                    $scope.firstPrev = true;
                    $scope.nextLast = true;
                } else {
                    // Between first and last page
                    $scope.nextLast = false;
                    $scope.firstPrev = false;
                }
            };

            var calculateNumberOfPages = function() {
                $scope.numberOfPages = Math.ceil($scope.resultsFound / $scope.offset);
                $scope.numberOfPages = $scope.numberOfPages < 1 ? 0 : $scope.numberOfPages;

                if ($scope.onPage > $scope.numberOfPages) {
                    $scope.onPage = $scope.numberOfPages;
                }
            };


            $scope.offsetChanged = function(doFetch) {
                calculateNumberOfPages();
                disableButtons($scope.onPage, $scope.numberOfPages);
                if (doFetch) {
                    $scope.fetchData($scope.onPage, $scope.offset);
                }
            };

            $scope.first = function() {
                if ($scope.firstPrev) {
                    return;
                }

                $scope.onPage = 1;

                $scope.fetchData($scope.onPage, $scope.offset);
                disableButtons($scope.onPage, $scope.numberOfPages);
                angular.element('#paginationPerPage').trigger('focus');
            };

            $scope.prev = function(append) {
                if ($scope.firstPrev) {
                    return;
                }

                $scope.onPage = parseInt($scope.onPage);
                $scope.onPage -= 1;

                $scope.fetchData($scope.onPage, $scope.offset, append);
                disableButtons($scope.onPage, $scope.numberOfPages);
                if ($scope.firstPrev) {
                    angular.element('#paginationPerPage').trigger('focus');
                }
            };

            $scope.next = function(append) {
                if ($scope.nextLast) {
                    return;
                }

                $scope.onPage = parseInt($scope.onPage);
                $scope.onPage += 1;

                $scope.fetchData($scope.onPage, $scope.offset, append);
                disableButtons($scope.onPage, $scope.numberOfPages);
                if ($scope.nextLast) {
                    angular.element('#paginationPerPage').trigger('focus');
                }
            };

            $scope.last = function() {
                if ($scope.nextLast) {
                    return;
                }

                $scope.onPage = $scope.numberOfPages;

                $scope.fetchData($scope.onPage, $scope.offset);
                disableButtons($scope.onPage, $scope.numberOfPages);
                angular.element('#paginationPerPage').trigger('focus');
            };

            $scope.keypress = function(event) {
                if(event.keyCode === 13) {
                    $scope.onPage = Math.round($scope.onPage);
					if( $scope.oldPageValue === $scope.onPage){
                        return;
                    }
                    if ($scope.onPage <= 0) {
                        notificationCenterService.displayNotificationWithParams("pagination.pageNotExist",$scope.onPage,undefined,"success",true);
                        $scope.onPage = 1;
                    } else if ($scope.onPage > $scope.numberOfPages) {
                        notificationCenterService.displayNotificationWithParams("pagination.pageNotExist",$scope.onPage,undefined,"success",true);
                        $scope.onPage = $scope.numberOfPages;
                    }

                    $scope.fetchData($scope.onPage, $scope.offset);
					disableButtons($scope.onPage, $scope.numberOfPages);
                }
                var elem = angular.element(event.target),
                    KEY_RIGHT = 39,
                    KEY_LEFT = 37,
                    target = elem;

                switch (event.which) {
                    case KEY_RIGHT:
                        $timeout(function () {
                            target = angular.element(event.target).next();
                            while (target.is("SPAN") || target.is("LABEL") || (target.is("BUTTON") && target[0].disabled)) {
                                target = angular.element(target).next();
                            }
                            angular.element(target).trigger('focus');
                        }, 200);
                        break;
                    case KEY_LEFT:
                        $timeout(function () {
                            target = angular.element(event.target).prev();
                            while (target.is("SPAN") || target.is("LABEL") || (target.is("BUTTON") && target[0].disabled)) {
                                target = angular.element(target).prev();
                            }
                            angular.element(target).trigger('focus');
                        }, 200);
                        break;
                    default:
                        return;
                }
                event.preventDefault();
            };

            $scope.paggeNumberChange = function() {
                var empty = $scope.onPage === 0;

                if (empty) {
                    $scope.nextLast = empty;
                    $scope.firstPrev = empty;
                }
            };

            // Private functions
            var resetPagination = function(length) {
                if (length === 0) {
                    $scope.onPage = 0;
                    $scope.paggeNumberChange();
                } else {
                    $scope.onPage = 1;
                    $scope.paggeNumberChange();
                }

                calculateNumberOfPages();
                disableButtons($scope.onPage, $scope.numberOfPages);
            };

            $scope.$watch("resultsFound", function() {
                $timeout(function() {
                    resetPagination($scope.resultsFound);
                });
            });

            /*
             boolean append variable is used to check if we need append to the result set or not.
             This is because on tablet we will not show the pagination but it components can still use pagination
             code to make the continuous scroll happen.
             */
            $scope.fetchData = function(onPage, offset) {
                if (!angular.isNumber(onPage)) {
                    onPage = parseInt(onPage);
                }
                var range = reassignRange(onPage, offset);
                $scope.setPagination(range.offset,offset);
            };

            $scope.offsetChanged(false);
        }]
    };
}]);
